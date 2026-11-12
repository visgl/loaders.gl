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
import {convertArrowToSchema, getDataTypeFromArray} from '@loaders.gl/core/schema-utils';
import type {Schema, TableBatch} from '@loaders.gl/core/schema';
import {DataSource} from '@loaders.gl/core/loader-utils';
import type {NDJSONLoaderOptions} from './ndjson-loader';

const NDJSON_TABLE_QUERY_CAPABILITIES = Object.freeze({
  predicate: 'residual',
  projection: 'residual',
  limit: 'pushdown',
  streaming: true,
  cancellation: true
} as const);

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

  /** Explains the portable NDJSON query without reading result batches. */
  async explain(options: TableScanReadOptions = {}) {
    const metadata = await this.getQueryMetadata(options);
    return explainTableQuery(
      metadata.columns.map(column => column.name),
      options,
      NDJSON_TABLE_QUERY_CAPABILITIES
    );
  }

  /** Streams NDJSON batches in source order with an optional global limit. */
  async *read(options: TableScanReadOptions = {}): AsyncIterable<TableBatch> {
    yield* executeTableScanBatches(
      (signal, onByteLength) => this.parseBatches(signal, onByteLength),
      options
    );
  }

  private async discoverMetadata(signal?: AbortSignal): Promise<ScanQueryMetadata> {
    for await (const batch of this.parseBatches(signal))
      if (batch.schema)
        return createScanQueryMetadata({
          sourceType: 'ndjson',
          queryType: 'table',
          execution: {status: 'supported', method: 'read'},
          schema: batch.schema,
          capabilities: {
            table: NDJSON_TABLE_QUERY_CAPABILITIES
          }
        });
    throw new Error('NDJSON source is empty and has no discoverable schema');
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
    const {NDJSONLoaderWithParser} = await import('./ndjson-loader');
    const declaredSchema = this.options.ndjson?.schema;
    let schema: Schema | undefined = declaredSchema
      ? declaredSchema.metadata instanceof Map
        ? convertArrowToSchema(declaredSchema as import('apache-arrow').Schema)
        : (declaredSchema as Schema)
      : undefined;
    for await (const batch of NDJSONLoaderWithParser.parseInBatches(chunks, {
      ...this.options,
      ndjson: {
        ...this.options.ndjson,
        schema: undefined,
        arrowConversion: undefined,
        shape: 'object-row-table'
      }
    })) {
      if (batch.shape !== 'object-row-table' && batch.shape !== 'array-row-table')
        throw new Error('Expected NDJSON row batches');
      schema ||= batch.schema;
      if (schema && !declaredSchema) {
        schema = {
          ...schema,
          fields: schema.fields.map((field, index) => {
            if (field.type !== 'null') return field;
            const value =
              batch.shape === 'array-row-table'
                ? batch.data.find(row => row[index] != null)?.[index]
                : batch.data.find(row => row[field.name] != null)?.[field.name];
            if (value == null) return field;
            const {type} = getDataTypeFromArray([value]);
            if (type === 'null') throw new Error(`Declare ndjson.schema for column ${field.name}`);
            return {...field, type, nullable: true};
          })
        };
      }
      yield {...batch, schema};
    }
  }
}

async function* readResponseChunks(
  response: Response,
  signal?: AbortSignal,
  onByteLength?: (byteLength: number) => void
): AsyncIterable<Uint8Array> {
  if (!response.ok) throw new Error(`NDJSON source request failed with status ${response.status}`);
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
