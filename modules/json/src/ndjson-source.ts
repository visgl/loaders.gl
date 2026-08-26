import type {
  CoreAPI,
  DataSourceOptions,
  SourceLoader,
  TableQueryMetadata,
  TableQueryOptions,
  TableScanSource
} from '@loaders.gl/loader-utils';
import type {TableBatch} from '@loaders.gl/schema';
import {DataSource} from '@loaders.gl/loader-utils';
import {NDJSONFormat} from './json-format';
import {NDJSONLoaderWithParser, type NDJSONLoaderOptions} from './ndjson-loader-with-parser';

/** Streams newline-delimited JSON through the common table scan contract. */
export type NDJSONSourceOptions = NDJSONLoaderOptions & DataSourceOptions;

export class NDJSONTableSource
  extends DataSource<string | Blob, NDJSONSourceOptions>
  implements TableScanSource
{
  private metadataPromise: Promise<TableQueryMetadata> | null = null;

  /** Creates an NDJSON source from a URL or Blob. */
  constructor(data: string | Blob, options: NDJSONSourceOptions = {}, coreApi?: CoreAPI) {
    super(data, options, undefined, coreApi);
  }

  /** Discovers the schema from the first decoded batch. */
  async getQueryMetadata(): Promise<TableQueryMetadata> {
    this.metadataPromise ||= this.discoverMetadata();
    return await this.metadataPromise;
  }

  /** Streams NDJSON batches in source order with an optional global limit. */
  async *scan(options: TableQueryOptions = {}): AsyncIterable<TableBatch> {
    let remaining =
      options.limit === undefined ? Number.POSITIVE_INFINITY : Math.max(0, options.limit);
    for await (const batch of this.parseBatches(options.signal)) {
      if (remaining <= 0) return;
      const projectedBatch = projectBatch(batch, options.columns);
      if (projectedBatch.length <= remaining) {
        remaining -= projectedBatch.length;
        yield projectedBatch;
      } else {
        yield truncateBatch(projectedBatch, remaining);
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
    yield* NDJSONLoaderWithParser.parseInBatches([arrayBuffer], {
      ...this.options,
      ndjson: {...this.options.ndjson, shape: 'object-row-table'}
    });
  }
}

/** Metadata-only NDJSON source loader. */
export const NDJSONSourceLoader = {
  ...NDJSONFormat,
  name: 'NDJSONSourceLoader',
  type: 'ndjson-source',
  version: '1.0.0',
  dataType: null as unknown as NDJSONTableSource,
  batchType: null as never,
  fromUrl: true,
  fromBlob: true,
  options: {},
  defaultOptions: {},
  testURL: (url: string): boolean => /\.(?:ndjson|jsonl)(?:$|[?#])/i.test(url),
  createDataSource: (data: string | Blob, options: NDJSONSourceOptions, coreApi?: CoreAPI) =>
    new NDJSONTableSource(data, options, coreApi)
} as const satisfies SourceLoader<NDJSONTableSource>;

function truncateBatch(batch: TableBatch, length: number): TableBatch {
  if (batch.shape === 'object-row-table' || batch.shape === 'array-row-table')
    return {...batch, data: batch.data.slice(0, length), length} as TableBatch;
  if (batch.shape === 'columnar-table')
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
  if (batch.shape === 'arrow-table') return {...batch, data: batch.data.slice(0, length), length};
  return {...batch, features: batch.features.slice(0, length), length};
}

function projectBatch(batch: TableBatch, columns?: readonly string[]): TableBatch {
  if (!columns?.length) return batch;
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
  if (batch.shape === 'arrow-table') return {...batch, data: batch.data.select([...columns])};
  return batch;
}
