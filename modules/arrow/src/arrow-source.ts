import * as arrow from 'apache-arrow';
import {
  createScanQueryMetadata,
  executeTableScanBatches,
  explainTableQuery,
  filterColumnarRowIndices,
  validateColumnarPredicate
} from '@loaders.gl/loader-utils';
import type {
  CoreAPI,
  DataSourceOptions,
  ScanQueryMetadata,
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
    yield* executeTableScanBatches(
      (signal, onByteLength) => this.parseBatches(signal, onByteLength),
      options,
      {filter: filterArrowBatch, project: projectArrowBatch}
    );
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

/** Applies the Arrow-native residual predicate while retaining the table-batch envelope. */
function filterArrowBatch(
  batch: TableBatch,
  predicate: TableScanReadOptions['predicate']
): TableBatch {
  const arrowBatch = batch as ArrowTableBatch;
  const data = filterArrowData(arrowBatch.data, predicate);
  return {
    ...batch,
    data,
    length: data.numRows,
    schema: convertArrowToSchema(data.schema)
  } as TableBatch;
}

/** Projects Arrow columns and updates the portable schema in one format-specific kernel. */
function projectArrowBatch(batch: TableBatch, columns?: readonly string[]): TableBatch {
  const arrowBatch = batch as ArrowTableBatch;
  const data = columns === undefined ? arrowBatch.data : arrowBatch.data.select([...columns]);
  return {
    ...batch,
    data,
    length: data.numRows,
    schema: convertArrowToSchema(data.schema)
  } as TableBatch;
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
