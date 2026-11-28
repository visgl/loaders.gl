import {Table, type RecordBatch} from 'apache-arrow';
import {makeArrowMetadataBatch} from '@loaders.gl/core/schema-utils';
import {
  createScanQueryMetadata,
  executeTableScanBatches,
  explainTableQuery
} from '@loaders.gl/core/loader-utils';
import type {
  CoreAPI,
  DataSourceOptions,
  ScanQueryMetadata,
  TableScanReadOptions,
  TableScanSource
} from '@loaders.gl/core/loader-utils';
import {convertArrowToSchema} from '@loaders.gl/core/schema-utils';
import {projectArrowTable, filterArrowTable} from '@loaders.gl/core/query/arrow-execution';
import {DataSource} from '@loaders.gl/core/loader-utils';

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
  implements TableScanSource<RecordBatch>
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
  async *read(options: TableScanReadOptions = {}): AsyncIterable<RecordBatch> {
    const offset = options.offset ?? 0;
    const limit = options.limit;
    const file =
      this.data instanceof Blob &&
      !options.predicate &&
      offset > 0 &&
      Number.isSafeInteger(offset) &&
      (limit === undefined || (limit > 0 && Number.isSafeInteger(limit))) &&
      !options.signal?.aborted
        ? this.data
        : undefined;
    const fileParser = file && (await import('./lib/parsers/read-arrow-file-window'));
    const readFileWindow = file && fileParser && (await fileParser.isArrowIPCFile(file));
    for await (const batch of executeTableScanBatches<Table>(
      (signal, onByteLength) =>
        readFileWindow
          ? fileParser.readArrowFileWindow(file, offset, signal, onByteLength)
          : this.parseBatches(signal, onByteLength),
      readFileWindow ? {...options, offset: undefined} : options,
      {filter: filterArrowBatch, project: projectArrowBatch}
    )) {
      if (batch.batches.length) yield* batch.batches;
      else yield makeArrowMetadataBatch(batch.schema);
    }
  }

  private async discoverMetadata(signal?: AbortSignal): Promise<ScanQueryMetadata> {
    for await (const batch of this.parseBatches(signal)) {
      const arrowSchema = batch.schema;
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
  ): AsyncIterable<Table> {
    if (signal?.aborted) throw new DOMException('The operation was aborted', 'AbortError');
    const chunks =
      this.data instanceof Blob
        ? readStreamChunks(this.data.stream(), signal, onByteLength)
        : readResponseChunks(await this.fetch(this.url, {signal}), signal, onByteLength);
    const {parseArrowInBatches} = await import('./lib/parsers/parse-arrow');
    for await (const batch of parseArrowInBatches(chunks)) {
      yield new Table(batch.schema, [batch]);
    }
  }
}

/** Applies an Arrow-native residual predicate to a decoded IPC chunk. */
function filterArrowBatch(
  batch: Table,
  predicate: TableScanReadOptions['predicate'],
  signal?: AbortSignal
): Table {
  return predicate ? filterArrowTable(batch, predicate, {signal}) : batch;
}

/** Projects columns in a decoded IPC chunk. */
function projectArrowBatch(batch: Table, columns?: readonly string[]): Table {
  return columns === undefined ? batch : projectArrowTable(batch, columns);
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
/** Creates a reusable Arrow source. */
export function createArrowSource(
  data: string | Blob,
  options: DataSourceOptions,
  coreApi?: CoreAPI
): ArrowTableSource {
  return new ArrowTableSource(data, options, coreApi);
}
