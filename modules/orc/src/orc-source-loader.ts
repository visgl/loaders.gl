// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable, ArrowTableBatch, DataType, Field, Schema} from '@loaders.gl/schema';
import type {
  DataSourceOptions,
  ScanQueryMetadata,
  ScanQueryMetadataOptions,
  SourceLoader
} from '@loaders.gl/loader-utils';
import {
  createScanQueryMetadata,
  DataSource,
  type TableQueryOptions
} from '@loaders.gl/loader-utils';
import {ORCFormat} from './orc-format';
import {parseORC, ORCTypeKind, type ORCTypeDescription} from './lib/parsers/parse-orc';
import {parseORCToArrow} from './lib/parsers/parse-orc-to-arrow';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for an ORC source backed by a URL, Blob, or complete ArrayBuffer. */
export type ORCSourceOptions = DataSourceOptions;

/** Query options accepted by the current ORC source implementation. */
export type ORCQueryOptions = TableQueryOptions & Readonly<{signal?: AbortSignal}>;

/** Source loader metadata for range-ready ORC query discovery. */
export const ORCSourceLoader = {
  dataType: null as unknown as ORCSource,
  batchType: null as never,
  ...ORCFormat,
  name: 'ORCSourceLoader',
  version: VERSION,
  type: 'orc-source',
  fromUrl: true,
  fromBlob: true,
  options: {},
  defaultOptions: {},
  testURL: (url: string): boolean => /\.orc(?:$|[?#])/i.test(url),
  createDataSource: (data: string | Blob, options: ORCSourceOptions): ORCSource =>
    new ORCSource(data, options)
} as const satisfies SourceLoader<ORCSource>;

/**
 * Lightweight ORC scan source.
 *
 * Footer parsing is metadata-only and exposes a shared query schema. The current decoder reads the
 * complete file before applying residual Arrow projection, predicates, and limits; stripe-level
 * pruning remains the next ORC-specific tranche.
 */
export class ORCSource extends DataSource<string | Blob, ORCSourceOptions> {
  private arrayBufferPromise: Promise<ArrayBuffer> | null = null;

  /** Creates an ORC source over a URL or Blob. */
  constructor(data: string | Blob, options: ORCSourceOptions = {}) {
    super(data, options);
  }

  /** Discovers ORC footer schema and stripe statistics without decoding data streams. */
  async getQueryMetadata(options: ScanQueryMetadataOptions = {}): Promise<ScanQueryMetadata> {
    const arrayBuffer = await this.getArrayBuffer(options.signal);
    const file = parseORC(arrayBuffer);
    const schema = createORCSchema(file.footer.types[0], file.footer.types);
    return createScanQueryMetadata({
      sourceType: 'orc',
      queryType: 'table',
      schema,
      capabilities: {
        table: {
          projection: 'residual',
          predicate: 'unsupported',
          limit: 'residual',
          streaming: false,
          cancellation: false
        }
      },
      statistics: {
        rowCount: file.footer.numberOfRows,
        byteLength: arrayBuffer.byteLength
      }
    });
  }

  /** Executes a portable query after decoding the ORC file into an Arrow table. */
  async query(options: ORCQueryOptions = {}): Promise<ArrowTable> {
    throwIfAborted(options.signal);
    const table = parseORCToArrow(await this.getArrayBuffer(options.signal));
    if (options.predicate) {
      throw new Error('ORC residual predicates are not implemented yet.');
    }
    const projectedData = table.data.select(
      options.columns ? [...options.columns] : table.data.schema.fields.map(field => field.name)
    );
    const limitedData = projectedData.slice(0, options.limit ?? Number.POSITIVE_INFINITY);
    return {
      shape: 'arrow-table',
      data: limitedData
    };
  }

  /** Executes a query as one bounded Arrow batch. */
  async *read(options: ORCQueryOptions = {}): AsyncIterableIterator<ArrowTableBatch> {
    const table = await this.query(options);
    yield {
      batchType: 'data',
      shape: 'arrow-table',
      schema: table.schema,
      data: table.data,
      length: table.data.numRows
    };
  }

  /** Returns the complete ORC bytes, fetching the source only once. */
  private async getArrayBuffer(signal?: AbortSignal): Promise<ArrayBuffer> {
    throwIfAborted(signal);
    if (!this.arrayBufferPromise) {
      this.arrayBufferPromise =
        typeof this.data === 'string'
          ? this.fetch(this.url, {signal}).then(response => {
              if (!response.ok)
                throw new Error(`ORC request failed with status ${response.status}.`);
              return response.arrayBuffer();
            })
          : this.data.arrayBuffer();
    }
    const arrayBuffer = await this.arrayBufferPromise;
    throwIfAborted(signal);
    return arrayBuffer;
  }
}

/** Converts an ORC struct footer type into a loaders.gl schema without reading stripes. */
function createORCSchema(
  rootType: ORCTypeDescription | undefined,
  types: readonly ORCTypeDescription[]
): Schema {
  const fields: Field[] =
    rootType?.fieldNames.map((name, index) => ({
      name,
      type: getORCDataType(types[rootType.subtypes[index]]?.kind),
      nullable: true,
      metadata: {}
    })) || [];
  return {fields, metadata: {}};
}

/** Maps supported ORC primitive kinds to portable schema data types. */
function getORCDataType(typeId: number): DataType {
  switch (typeId) {
    case ORCTypeKind.BOOLEAN:
      return 'bool';
    case ORCTypeKind.BYTE:
      return 'int8';
    case ORCTypeKind.SHORT:
      return 'int16';
    case ORCTypeKind.INT:
    case ORCTypeKind.DATE:
      return 'int32';
    case ORCTypeKind.LONG:
      return 'int64';
    case ORCTypeKind.FLOAT:
      return 'float32';
    case ORCTypeKind.DOUBLE:
      return 'float64';
    case ORCTypeKind.BINARY:
      return 'binary';
    case ORCTypeKind.TIMESTAMP:
      return 'timestamp-millisecond';
    default:
      return 'utf8';
  }
}

/** Throws the common source cancellation error before metadata or decode work begins. */
function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw new Error('Request aborted');
}
