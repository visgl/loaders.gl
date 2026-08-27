import {
  createScanQueryMetadata,
  filterColumnarRowIndices,
  validateColumnarPredicate,
  validateTableQueryLimit
} from '@loaders.gl/loader-utils';
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
import {NDJSONFormat} from './json-format';
import type {NDJSONLoaderOptions} from './ndjson-loader-with-parser';

/** Streams newline-delimited JSON through the common table scan contract. */
export type NDJSONSourceOptions = NDJSONLoaderOptions & DataSourceOptions;

export class NDJSONTableSource
  extends DataSource<string | Blob, NDJSONSourceOptions>
  implements TableScanSource<TableBatch>
{
  private metadataPromise: Promise<ScanQueryMetadata> | null = null;

  /** Creates an NDJSON source from a URL or Blob. */
  constructor(data: string | Blob, options: NDJSONSourceOptions = {}, coreApi?: CoreAPI) {
    super(data, options, undefined, coreApi);
  }

  /** Discovers the schema from the first decoded batch. */
  async getQueryMetadata(options: TableScanReadOptions = {}): Promise<ScanQueryMetadata> {
    this.metadataPromise ||= this.discoverMetadata(options.signal);
    return await this.metadataPromise;
  }

  /** Streams NDJSON batches in source order with an optional global limit. */
  async *read(options: TableScanReadOptions = {}): AsyncIterable<TableBatch> {
    validateTableQueryLimit(options.limit);
    let remaining =
      options.limit === undefined ? Number.POSITIVE_INFINITY : Math.max(0, options.limit);
    for await (const batch of this.parseBatches(options.signal)) {
      if (remaining <= 0) return;
      const filteredBatch = filterBatch(batch, options.predicate);
      const projectedBatch = projectBatch(filteredBatch, options.columns);
      if (projectedBatch.length <= remaining) {
        remaining -= projectedBatch.length;
        yield projectedBatch;
      } else {
        yield truncateBatch(projectedBatch, remaining);
        return;
      }
    }
  }

  private async discoverMetadata(signal?: AbortSignal): Promise<ScanQueryMetadata> {
    for await (const batch of this.parseBatches(signal))
      if (batch.schema)
        return createScanQueryMetadata({
          sourceType: 'ndjson',
          queryType: 'table',
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
    throw new Error('NDJSON source is empty and has no discoverable schema');
  }

  private async *parseBatches(signal?: AbortSignal): AsyncIterable<TableBatch> {
    if (signal?.aborted) throw new DOMException('The operation was aborted', 'AbortError');
    const chunks =
      this.data instanceof Blob
        ? readStreamChunks(this.data.stream(), signal)
        : readResponseChunks(await this.fetch(this.url, {signal}), signal);
    const {NDJSONLoaderWithParser} = await import('./ndjson-loader-with-parser');
    yield* NDJSONLoaderWithParser.parseInBatches(chunks, {
      ...this.options,
      ndjson: {...this.options.ndjson, shape: 'object-row-table'}
    });
  }
}

async function* readResponseChunks(
  response: Response,
  signal?: AbortSignal
): AsyncIterable<Uint8Array> {
  if (!response.ok) throw new Error(`NDJSON source request failed with status ${response.status}`);
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
  if (batch.shape === 'arrow-table') return {...batch, data: batch.data.select([...columns])};
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
  const rowIndices = filterColumnarRowIndices(predicate, columns, rows.length);
  return {...batch, data: rowIndices.map(rowIndex => rows[rowIndex]), length: rowIndices.length};
}
