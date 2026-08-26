import type {
  CoreAPI,
  DataSourceOptions,
  SourceLoader,
  TableQueryMetadata,
  TableQueryOptions,
  TableScanSource
} from '@loaders.gl/loader-utils';
import type {ArrowTableBatch, TableBatch} from '@loaders.gl/schema';
import {DataSource} from '@loaders.gl/loader-utils';
import {ArrowFormat} from './exports/arrow-format';
import {ArrowLoaderWithParser} from './arrow-loader-with-parser';

/** Streams Arrow IPC record batches through the common table scan contract. */
export class ArrowTableSource
  extends DataSource<string | Blob, DataSourceOptions>
  implements TableScanSource
{
  private metadataPromise: Promise<TableQueryMetadata> | null = null;

  /** Creates an Arrow IPC source from a URL or Blob. */
  constructor(data: string | Blob, options: DataSourceOptions = {}, coreApi?: CoreAPI) {
    super(data, options, undefined, coreApi);
  }

  /** Discovers Arrow schema and reports supported linear operations. */
  async getQueryMetadata(): Promise<TableQueryMetadata> {
    this.metadataPromise ||= this.discoverMetadata();
    return await this.metadataPromise;
  }

  /** Streams Arrow record batches in source order with an optional global limit. */
  async *scan(options: TableQueryOptions = {}): AsyncIterable<TableBatch> {
    let remaining =
      options.limit === undefined ? Number.POSITIVE_INFINITY : Math.max(0, options.limit);
    for await (const batch of this.parseBatches(options.signal)) {
      if (remaining <= 0) return;
      const arrowBatch = batch as ArrowTableBatch;
      const projectedData = options.columns?.length
        ? arrowBatch.data.select([...options.columns])
        : arrowBatch.data;
      const projectedBatch = {...batch, data: projectedData, length: batch.length} as TableBatch;
      if (batch.length <= remaining) {
        remaining -= batch.length;
        yield projectedBatch;
      } else {
        yield {...projectedBatch, data: projectedData.slice(0, remaining), length: remaining};
        return;
      }
    }
  }

  private async discoverMetadata(): Promise<TableQueryMetadata> {
    for await (const batch of this.parseBatches())
      return {
        schema: batch.schema,
        capabilities: {predicate: false, projection: true, limit: true}
      };
    return {capabilities: {predicate: false, projection: true, limit: true}};
  }

  private async *parseBatches(signal?: AbortSignal): AsyncIterable<TableBatch> {
    if (signal?.aborted) throw new DOMException('The operation was aborted', 'AbortError');
    const arrayBuffer =
      this.data instanceof Blob
        ? await this.data.arrayBuffer()
        : await (await this.fetch(this.url, {signal})).arrayBuffer();
    yield* ArrowLoaderWithParser.parseInBatches([arrayBuffer]);
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
