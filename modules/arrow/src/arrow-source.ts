import * as arrow from 'apache-arrow';
import {
  createScanQueryMetadata,
  explainTableQuery,
  filterColumnarRowIndices,
  validateColumnarPredicate,
  validateTableQueryLimit
} from '@loaders.gl/loader-utils';
import type {
  CoreAPI,
  DataSourceOptions,
  ScanQueryMetadata,
  ScanExecutionTelemetry,
  SourceLoader,
  TableScanReadOptions,
  TableScanSource
} from '@loaders.gl/loader-utils';
import type {ArrowTableBatch, TableBatch} from '@loaders.gl/schema';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';
import {DataSource} from '@loaders.gl/loader-utils';
import {ArrowFormat} from './exports/arrow-format';

const ARROW_TABLE_QUERY_CAPABILITIES = Object.freeze({
  predicate: 'residual',
  projection: 'pushdown',
  limit: 'pushdown',
  streaming: true,
  cancellation: true
} as const);

/** Streams Arrow IPC record batches through the common table scan contract. */
export class ArrowTableSource
  extends DataSource<string | Blob, DataSourceOptions>
  implements TableScanSource<TableBatch>
{
  private metadataPromise: Promise<ScanQueryMetadata> | null = null;

  /** Creates an Arrow IPC source from a URL or Blob. */
  constructor(data: string | Blob, options: DataSourceOptions = {}, coreApi?: CoreAPI) {
    super(data, options, undefined, coreApi);
  }

  /** Discovers Arrow schema and reports supported linear operations. */
  async getQueryMetadata(options: TableScanReadOptions = {}): Promise<ScanQueryMetadata> {
    this.metadataPromise ||= this.discoverMetadata(options.signal);
    return await this.metadataPromise;
  }

  /** Explains the portable Arrow IPC query without decoding result rows. */
  async explain(options: TableScanReadOptions = {}) {
    const metadata = await this.getQueryMetadata(options);
    return explainTableQuery(
      metadata.columns.map(column => column.name),
      options,
      ARROW_TABLE_QUERY_CAPABILITIES
    );
  }

  /** Streams Arrow record batches in source order with an optional global limit. */
  async *read(options: TableScanReadOptions = {}): AsyncIterable<TableBatch> {
    validateTableQueryLimit(options.limit);
    const startedAt = Date.now();
    let sourcesRead = 0;
    let batchesRead = 0;
    let rowsRead = 0;
    let rowsTested = 0;
    let rowsRetained = 0;
    let rowsReturned = 0;
    let bytesFetched = 0;
    let status: ScanExecutionTelemetry['status'] = 'early-terminated';
    let earlyTerminationReason: ScanExecutionTelemetry['earlyTerminationReason'];
    let executionError: unknown;
    let remaining =
      options.limit === undefined ? Number.POSITIVE_INFINITY : Math.max(0, options.limit);
    try {
      if (remaining <= 0) {
        earlyTerminationReason = 'limit';
        return;
      }
      sourcesRead = 1;
      for await (const batch of this.parseBatches(
        options.signal,
        byteLength => (bytesFetched += byteLength)
      )) {
        if (remaining <= 0) {
          earlyTerminationReason = 'limit';
          return;
        }
        const arrowBatch = batch as ArrowTableBatch;
        batchesRead++;
        rowsRead += batch.length;
        const filteredData = filterArrowData(arrowBatch.data, options.predicate);
        if (options.predicate) {
          rowsTested += batch.length;
          rowsRetained += filteredData.numRows;
        }
        const projectedData =
          options.columns !== undefined ? filteredData.select([...options.columns]) : filteredData;
        const outputLength = Math.min(projectedData.numRows, remaining);
        if (outputLength <= 0) continue;
        rowsReturned += outputLength;
        yield {
          ...batch,
          data:
            outputLength === projectedData.numRows
              ? projectedData
              : projectedData.slice(0, outputLength),
          schema: convertArrowToSchema(projectedData.schema),
          length: outputLength
        } as TableBatch;
        remaining -= outputLength;
      }
      status = 'completed';
    } catch (error) {
      status = options.signal?.aborted ? 'cancelled' : 'failed';
      executionError = error;
      throw error;
    } finally {
      if (status === 'early-terminated' && !earlyTerminationReason) {
        earlyTerminationReason = 'consumer-return';
      }
      options.onTelemetry?.(
        Object.freeze({
          status,
          sourcesPlanned: 1,
          sourcesRead,
          batchesRead,
          batchesDecoded: batchesRead,
          rowsRead,
          rowsTested: rowsTested || undefined,
          rowsRetained: rowsRetained || undefined,
          rowsReturned,
          bytesRead: bytesFetched,
          bytesFetched,
          filesOpened: sourcesRead,
          tasksOpened: sourcesRead,
          earlyTerminationReason,
          durationMilliseconds: Date.now() - startedAt,
          ...(executionError === undefined ? {} : {error: executionError})
        })
      );
    }
  }

  private async discoverMetadata(signal?: AbortSignal): Promise<ScanQueryMetadata> {
    for await (const batch of this.parseBatches(signal)) {
      const arrowSchema = (batch as ArrowTableBatch).data.schema;
      return createScanQueryMetadata({
        sourceType: 'arrow',
        queryType: 'table',
        execution: {status: 'supported', method: 'read'},
        schema: convertArrowToSchema(arrowSchema),
        capabilities: {
          table: ARROW_TABLE_QUERY_CAPABILITIES
        }
      });
    }
    throw new Error('Arrow source is empty and has no discoverable schema');
  }

  private async *parseBatches(
    signal?: AbortSignal,
    onByteLength?: (byteLength: number) => void
  ): AsyncIterable<TableBatch> {
    if (signal?.aborted) throw new DOMException('The operation was aborted', 'AbortError');
    const chunks =
      this.data instanceof Blob
        ? readStreamChunks(this.data.stream(), signal, onByteLength)
        : readResponseChunks(await this.fetch(this.url, {signal}), signal, onByteLength);
    const {ArrowLoaderWithParser} = await import('./arrow-loader-with-parser');
    yield* ArrowLoaderWithParser.parseInBatches(chunks);
  }
}

/** Applies the portable three-valued predicate evaluator without changing Arrow field types. */
function filterArrowData(
  data: arrow.Table,
  predicate: TableScanReadOptions['predicate']
): arrow.Table {
  if (!predicate) return data;
  const columnNames = new Set(data.schema.fields.map(field => field.name));
  validateColumnarPredicate(predicate, columnNames);
  const columns = Object.fromEntries(
    data.schema.fields.map(field => [field.name, Array.from(data.getChild(field.name)!)])
  );
  const rowIndices = filterColumnarRowIndices(predicate as never, columns as never, data.numRows);
  if (rowIndices.length === data.numRows) return data;
  const filteredColumns = Object.fromEntries(
    data.schema.fields.map(field => {
      const vector = data.getChild(field.name)!;
      return [
        field.name,
        arrow.vectorFromArray(
          rowIndices.map(rowIndex => vector.get(rowIndex)),
          field.type
        )
      ];
    })
  );
  return new arrow.Table(data.schema, filteredColumns);
}

async function* readResponseChunks(
  response: Response,
  signal?: AbortSignal,
  onByteLength?: (byteLength: number) => void
): AsyncIterable<Uint8Array> {
  if (!response.ok) throw new Error(`Arrow source request failed with status ${response.status}`);
  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    onByteLength?.(bytes.byteLength);
    yield bytes;
    return;
  }
  yield* readStreamChunks(response.body, signal, onByteLength);
}

async function* readStreamChunks(
  stream: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
  onByteLength?: (byteLength: number) => void
): AsyncIterable<Uint8Array> {
  const reader = stream.getReader();
  try {
    while (true) {
      if (signal?.aborted) throw new DOMException('The operation was aborted', 'AbortError');
      const result = await reader.read();
      if (result.done) return;
      onByteLength?.(result.value.byteLength);
      yield result.value;
    }
  } finally {
    await reader.cancel();
  }
}

/** Metadata-only Arrow IPC source loader. */
export const ArrowSourceLoader = {
  ...ArrowFormat,
  name: 'ArrowSourceLoader',
  type: 'arrow-source',
  version: '1.0.0',
  dataType: null as unknown as ArrowTableSource,
  batchType: null as never,
  fromUrl: true,
  fromBlob: true,
  options: {},
  defaultOptions: {},
  testURL: (url: string): boolean => /\.(?:arrow|feather|ipc)(?:$|[?#])/i.test(url),
  createDataSource: (data: string | Blob, options: DataSourceOptions, coreApi?: CoreAPI) =>
    new ArrowTableSource(data, options, coreApi)
} as const satisfies SourceLoader<ArrowTableSource>;
