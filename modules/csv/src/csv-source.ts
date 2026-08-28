import {
  createScanQueryMetadata,
  filterColumnarRowIndices,
  validateColumnarPredicate,
  validateTableQueryLimit
} from '@loaders.gl/loader-utils';
import type {
  CoreAPI,
  DataSourceOptions,
  ScanExecutionTelemetry,
  ScanQueryMetadata,
  SourceLoader,
  TableScanReadOptions,
  TableScanSource
} from '@loaders.gl/loader-utils';
import type {TableBatch} from '@loaders.gl/schema';
import {DataSource} from '@loaders.gl/loader-utils';
import type {CSVLoaderOptions} from './csv-loader-options';
import {CSVFormat} from './csv-format';

/** Options for the forward-only CSV table source. */
export type CSVSourceOptions = CSVLoaderOptions & DataSourceOptions;

/** Streams CSV rows through the shared table-scan contract. */
export class CSVTableSource
  extends DataSource<string | Blob, CSVSourceOptions>
  implements TableScanSource<TableBatch>
{
  private metadataPromise: Promise<ScanQueryMetadata> | null = null;

  /** Creates a CSV table source from a URL or Blob. */
  constructor(data: string | Blob, options: CSVSourceOptions = {}, coreApi?: CoreAPI) {
    super(data, options, undefined, coreApi);
  }

  /** Discovers the schema by parsing the first batch. */
  async getQueryMetadata(options: TableScanReadOptions = {}): Promise<ScanQueryMetadata> {
    this.metadataPromise ||= this.discoverMetadata(options.signal);
    return await this.metadataPromise;
  }

  /** Streams CSV batches, enforcing a global limit when requested. */
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
        batchesRead++;
        rowsRead += batch.length;
        const filteredBatch = filterBatch(batch, options.predicate);
        if (options.predicate) {
          rowsTested += batch.length;
          rowsRetained += filteredBatch.length;
        }
        const projectedBatch = projectBatch(filteredBatch, options.columns);
        if (projectedBatch.length <= remaining) {
          remaining -= projectedBatch.length;
          rowsReturned += projectedBatch.length;
          yield projectedBatch;
        } else {
          const outputBatch = truncateBatch(projectedBatch, remaining);
          rowsReturned += outputBatch.length;
          earlyTerminationReason = 'limit';
          yield outputBatch;
          return;
        }
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
          durationMilliseconds: Date.now() - startedAt,
          earlyTerminationReason,
          ...(executionError === undefined ? {} : {error: executionError})
        })
      );
    }
  }

  private async discoverMetadata(signal?: AbortSignal): Promise<ScanQueryMetadata> {
    for await (const batch of this.parseBatches(signal)) {
      if (!batch.schema) throw new Error('CSV source did not provide a schema');
      return createScanQueryMetadata({
        sourceType: 'csv',
        queryType: 'table',
        execution: {status: 'supported', method: 'read'},
        schema: batch.schema,
        capabilities: {
          table: {
            predicate: 'residual',
            projection: 'pushdown',
            limit: 'pushdown',
            streaming: true,
            cancellation: true
          }
        }
      });
    }
    throw new Error('CSV source is empty and has no discoverable schema');
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
    const {CSVLoaderWithParser} = await import('./csv-loader-with-parser');
    yield* CSVLoaderWithParser.parseInBatches(chunks, {
      ...this.options,
      csv: {...this.options.csv, shape: 'object-row-table'}
    });
  }
}

async function* readResponseChunks(
  response: Response,
  signal?: AbortSignal,
  onByteLength?: (byteLength: number) => void
): AsyncIterable<Uint8Array> {
  if (!response.ok) throw new Error(`CSV source request failed with status ${response.status}`);
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

/** Metadata-only CSV source loader. */
export const CSVSourceLoader = {
  ...CSVFormat,
  name: 'CSVSourceLoader',
  type: 'csv-source',
  version: '1.0.0',
  dataType: null as unknown as CSVTableSource,
  batchType: null as never,
  fromUrl: true,
  fromBlob: true,
  options: {},
  defaultOptions: {},
  testURL: (url: string): boolean => /\.csv(?:$|[?#])/i.test(url),
  createDataSource: (data: string | Blob, options: CSVSourceOptions, coreApi?: CoreAPI) =>
    new CSVTableSource(data, options, coreApi)
} as const satisfies SourceLoader<CSVTableSource>;

function truncateBatch(batch: TableBatch, length: number): TableBatch {
  if (batch.shape === 'object-row-table' || batch.shape === 'array-row-table') {
    return {...batch, data: batch.data.slice(0, length), length} as TableBatch;
  }
  if (batch.shape === 'columnar-table') {
    return {
      ...batch,
      data: Object.fromEntries(
        Object.entries(batch.data).map(([name, values]) => [
          name,
          Array.from(values as ArrayLike<unknown>).slice(0, length)
        ])
      ),
      length
    };
  }
  if (batch.shape === 'arrow-table') return {...batch, data: batch.data.slice(0, length), length};
  return {...batch, features: batch.features.slice(0, length), length};
}

function projectBatch(batch: TableBatch, columns?: readonly string[]): TableBatch {
  if (columns === undefined) return batch;
  if (batch.shape === 'object-row-table')
    return {
      ...batch,
      data: batch.data.map(row => Object.fromEntries(columns.map(column => [column, row[column]])))
    } as TableBatch;
  if (batch.shape === 'columnar-table')
    return {
      ...batch,
      data: Object.fromEntries(columns.map(column => [column, batch.data[column]]))
    } as TableBatch;
  if (batch.shape === 'arrow-table')
    return {...batch, data: batch.data.select([...columns])} as TableBatch;
  return batch;
}

function filterBatch(batch: TableBatch, predicate: TableScanReadOptions['predicate']): TableBatch {
  if (!predicate || batch.shape !== 'object-row-table') return batch;
  const rows = batch.data;
  const columnNames = new Set(batch.schema?.fields.map(field => field.name) || []);
  validateColumnarPredicate(predicate, columnNames);
  const columns = Object.fromEntries(
    [...columnNames].map(name => [name, rows.map(row => row[name])])
  );
  const rowIndices = filterColumnarRowIndices(predicate as never, columns, rows.length);
  return {...batch, data: rowIndices.map(rowIndex => rows[rowIndex]), length: rowIndices.length};
}
