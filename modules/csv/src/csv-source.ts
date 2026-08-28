import {
  createScanQueryMetadata,
  executeTableScanBatches,
  explainTableQuery
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
import type {CSVLoaderOptions} from './csv-loader-options';
import {CSVFormat} from './csv-format';

const CSV_TABLE_QUERY_CAPABILITIES = Object.freeze({
  predicate: 'residual',
  projection: 'pushdown',
  limit: 'pushdown',
  streaming: true,
  cancellation: true
} as const);

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

  /** Explains the portable CSV query without reading result batches. */
  async explain(options: TableScanReadOptions = {}) {
    const metadata = await this.getQueryMetadata(options);
    return explainTableQuery(
      metadata.columns.map(column => column.name),
      options,
      CSV_TABLE_QUERY_CAPABILITIES
    );
  }

  /** Streams CSV batches, enforcing a global limit when requested. */
  async *read(options: TableScanReadOptions = {}): AsyncIterable<TableBatch> {
    yield* executeTableScanBatches(
      (signal, onByteLength) => this.parseBatches(signal, onByteLength),
      options
    );
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
          table: CSV_TABLE_QUERY_CAPABILITIES
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
