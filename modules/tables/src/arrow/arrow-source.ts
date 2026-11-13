import {
  createScanQueryMetadata,
  executeTableScanBatches,
  explainTableQuery
} from '@loaders.gl/core/loader-utils';
import type {
  CoreAPI,
  DataSourceOptions,
  ScanQueryMetadata,
  SourceLoader,
  TableScanReadOptions,
  TableScanSource
} from '@loaders.gl/core/loader-utils';
import type {ArrowTableBatch, TableBatch} from '@loaders.gl/core/schema';
import {convertArrowToSchema} from '@loaders.gl/core/schema-utils';
import {projectArrowTable, filterArrowTable} from '@loaders.gl/core/scan/arrow-execution';
import {DataSource} from '@loaders.gl/core/loader-utils';
import {ArrowFormat} from './exports/arrow-format';

const ARROW_TABLE_QUERY_CAPABILITIES = Object.freeze({
  predicate: 'residual',
  projection: 'residual',
  limit: 'pushdown',
  offset: 'pushdown',
  cast: 'unsupported',
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
    const {parseArrowInBatches} = await import('./lib/parsers/parse-arrow');
    yield* parseArrowInBatches(chunks);
  }
}

/** Applies the Arrow-native residual predicate while retaining the table-batch envelope. */
function filterArrowBatch(
  batch: TableBatch,
  predicate: TableScanReadOptions['predicate'],
  signal?: AbortSignal
): TableBatch {
  const arrowBatch = batch as ArrowTableBatch;
  const data = predicate ? filterArrowTable(arrowBatch.data, predicate, {signal}) : arrowBatch.data;
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
  const data =
    columns === undefined ? arrowBatch.data : projectArrowTable(arrowBatch.data, columns);
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
  createDataSourceSync: (data: string | Blob, options: DataSourceOptions, coreApi?: CoreAPI) =>
    new ArrowTableSource(data, options, coreApi)
} as const satisfies SourceLoader<ArrowTableSource>;
