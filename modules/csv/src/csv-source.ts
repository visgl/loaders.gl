import {createScanQueryMetadata, validateTableQueryLimit} from '@loaders.gl/loader-utils';
import type {
  CoreAPI,
  DataSourceOptions,
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

  private async discoverMetadata(signal?: AbortSignal): Promise<ScanQueryMetadata> {
    for await (const batch of this.parseBatches(signal)) {
      if (!batch.schema) throw new Error('CSV source did not provide a schema');
      return createScanQueryMetadata({
        sourceType: 'csv',
        queryType: 'table',
        schema: batch.schema,
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
    throw new Error('CSV source is empty and has no discoverable schema');
  }

  private async *parseBatches(signal?: AbortSignal): AsyncIterable<TableBatch> {
    if (signal?.aborted) throw new DOMException('The operation was aborted', 'AbortError');
    const chunks =
      this.data instanceof Blob
        ? readStreamChunks(this.data.stream(), signal)
        : readResponseChunks(await this.fetch(this.url, {signal}), signal);
    const {CSVLoaderWithParser} = await import('./csv-loader-with-parser');
    yield* CSVLoaderWithParser.parseInBatches(chunks, {
      ...this.options,
      csv: {...this.options.csv, shape: 'object-row-table'}
    });
  }
}

async function* readResponseChunks(
  response: Response,
  signal?: AbortSignal
): AsyncIterable<Uint8Array> {
  if (!response.ok) throw new Error(`CSV source request failed with status ${response.status}`);
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
