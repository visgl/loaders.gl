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
import type {CSVLoaderOptions} from './csv-loader-options';
import {CSVFormat} from './csv-format';
import {CSVLoaderWithParser} from './csv-loader-with-parser';

/** Options for the forward-only CSV table source. */
export type CSVSourceOptions = CSVLoaderOptions & DataSourceOptions;

/** Streams CSV rows through the shared table-scan contract. */
export class CSVTableSource
  extends DataSource<string | Blob, CSVSourceOptions>
  implements TableScanSource
{
  private metadataPromise: Promise<TableQueryMetadata> | null = null;

  /** Creates a CSV table source from a URL or Blob. */
  constructor(data: string | Blob, options: CSVSourceOptions = {}, coreApi?: CoreAPI) {
    super(data, options, undefined, coreApi);
  }

  /** Discovers the schema by parsing the first batch. */
  async getQueryMetadata(): Promise<TableQueryMetadata> {
    this.metadataPromise ||= this.discoverMetadata();
    return await this.metadataPromise;
  }

  /** Streams CSV batches, enforcing a global limit when requested. */
  async *scan(options: TableQueryOptions = {}): AsyncIterable<TableBatch> {
    let remaining =
      options.limit === undefined ? Number.POSITIVE_INFINITY : Math.max(0, options.limit);
    for await (const batch of this.parseBatches(options.signal)) {
      if (remaining <= 0) return;
      const projectedBatch = projectBatch(batch, options.columns);
      if (projectedBatch.length <= remaining) {
        remaining -= batch.length;
        yield projectedBatch;
      } else {
        yield truncateBatch(projectedBatch, remaining);
        return;
      }
    }
  }

  private async discoverMetadata(): Promise<TableQueryMetadata> {
    for await (const batch of this.parseBatches()) {
      return {
        schema: batch.schema,
        capabilities: {predicate: false, projection: true, limit: true}
      };
    }
    return {capabilities: {predicate: false, projection: true, limit: true}};
  }

  private async *parseBatches(signal?: AbortSignal): AsyncIterable<TableBatch> {
    if (signal?.aborted) throw new DOMException('The operation was aborted', 'AbortError');
    const arrayBuffer =
      this.data instanceof Blob
        ? await this.data.arrayBuffer()
        : await (await this.fetch(this.url, {signal})).arrayBuffer();
    yield* CSVLoaderWithParser.parseInBatches([arrayBuffer], {
      ...this.options,
      csv: {...this.options.csv, shape: 'object-row-table'}
    });
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
  if (batch.shape === 'arrow-table')
    return {...batch, data: batch.data.select([...columns])} as TableBatch;
  return batch;
}
