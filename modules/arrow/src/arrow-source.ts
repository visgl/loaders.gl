import {createScanQueryMetadata, validateTableQueryLimit} from '@loaders.gl/loader-utils';
import type {
  CoreAPI,
  DataSourceOptions,
  ScanQueryMetadata,
  SourceLoader,
  TableScanReadOptions,
  TableScanSource
} from '@loaders.gl/loader-utils';
import type {ArrowTableBatch, TableBatch} from '@loaders.gl/schema';
import {DataSource} from '@loaders.gl/loader-utils';
import {ArrowFormat} from './exports/arrow-format';

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

  /** Streams Arrow record batches in source order with an optional global limit. */
  async *read(options: TableScanReadOptions = {}): AsyncIterable<TableBatch> {
    validateTableQueryLimit(options.limit);
    let remaining =
      options.limit === undefined ? Number.POSITIVE_INFINITY : Math.max(0, options.limit);
    for await (const batch of this.parseBatches(options.signal)) {
      if (remaining <= 0) return;
      const arrowBatch = batch as ArrowTableBatch;
      const projectedData =
        options.columns !== undefined
          ? arrowBatch.data.select([...options.columns])
          : arrowBatch.data;
      const projectedBatch = {...batch, data: projectedData, length: batch.length} as TableBatch;
      if (batch.length <= remaining) {
        remaining -= batch.length;
        yield projectedBatch;
      } else {
        yield {
          ...projectedBatch,
          data: projectedData.slice(0, remaining),
          length: remaining
        } as TableBatch;
        return;
      }
    }
  }

  private async discoverMetadata(signal?: AbortSignal): Promise<ScanQueryMetadata> {
    for await (const batch of this.parseBatches(signal)) {
      const arrowSchema = (batch as ArrowTableBatch).data.schema;
      return createScanQueryMetadata({
        sourceType: 'arrow',
        queryType: 'table',
        execution: {status: 'supported', method: 'read'},
        schema: {fields: arrowSchema.fields as never, metadata: {}},
        capabilities: {
          table: {
            predicate: 'unsupported',
            projection: 'pushdown',
            limit: 'pushdown',
            streaming: true,
            cancellation: true
          }
        }
      });
    }
    throw new Error('Arrow source is empty and has no discoverable schema');
  }

  private async *parseBatches(signal?: AbortSignal): AsyncIterable<TableBatch> {
    if (signal?.aborted) throw new DOMException('The operation was aborted', 'AbortError');
    const chunks =
      this.data instanceof Blob
        ? readStreamChunks(this.data.stream(), signal)
        : readResponseChunks(await this.fetch(this.url, {signal}), signal);
    const {ArrowLoaderWithParser} = await import('./arrow-loader-with-parser');
    yield* ArrowLoaderWithParser.parseInBatches(chunks);
  }
}

async function* readResponseChunks(
  response: Response,
  signal?: AbortSignal
): AsyncIterable<Uint8Array> {
  if (!response.ok) throw new Error(`Arrow source request failed with status ${response.status}`);
  if (!response.body) {
    yield new Uint8Array(await response.arrayBuffer());
    return;
  }
  yield* readStreamChunks(response.body, signal);
}

async function* readStreamChunks(
  stream: ReadableStream<Uint8Array>,
  signal?: AbortSignal
): AsyncIterable<Uint8Array> {
  const reader = stream.getReader();
  try {
    while (true) {
      if (signal?.aborted) throw new DOMException('The operation was aborted', 'AbortError');
      const result = await reader.read();
      if (result.done) return;
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
