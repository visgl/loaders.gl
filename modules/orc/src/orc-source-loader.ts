// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable, ArrowTableBatch, DataType, Field, Schema} from '@loaders.gl/schema';
import * as arrow from 'apache-arrow';
import type {
  DataSourceOptions,
  ScanQueryMetadata,
  ScanQueryMetadataOptions,
  SourceLoader,
  TableQueryOptions
} from '@loaders.gl/loader-utils';
import {
  createScanQueryMetadata,
  DataSource,
  validateTableQueryOptions,
  filterColumnarRowIndices
} from '@loaders.gl/loader-utils';
import {parseORC, ORCTypeKind, type ORCTypeDescription} from './lib/parsers/parse-orc';
import {parseORCToArrow} from './lib/parsers/parse-orc-to-arrow';
import {preloadORCCompression} from './lib/parsers/orc-compression';
import {ORCFormat} from './orc-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for an ORC source backed by a URL, Blob, or complete ArrayBuffer. */
export type ORCSourceOptions = DataSourceOptions;

/** Query options accepted by the current ORC source implementation. */
export type ORCQueryOptions = TableQueryOptions & Readonly<{signal?: AbortSignal}>;

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
    await preloadORCCompression();
    const file = parseORC(arrayBuffer);
    const schema = createORCSchema(file.footer.types[0], file.footer.types);
    return createScanQueryMetadata({
      sourceType: 'orc',
      queryType: 'table',
      execution: {status: 'supported', method: 'read'},
      schema,
      capabilities: {
        table: {
          projection: 'residual',
          predicate: 'residual',
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
    const arrayBuffer = await this.getArrayBuffer(options.signal);
    await preloadORCCompression();
    const file = parseORC(arrayBuffer);
    validateTableQueryOptions(
      file.footer.fieldNames.length
        ? file.footer.fieldNames
        : file.footer.types[0]?.fieldNames || [],
      options
    );
    const table = parseORCToArrow(arrayBuffer);
    const availableColumns = table.data.schema.fields.map(field => field.name);
    validateTableQueryOptions(availableColumns, options);
    const selectedColumnNames = options.columns ? [...options.columns] : availableColumns;
    let projectedData;
    if (options.predicate) {
      const columns: Record<string, unknown[]> = Object.fromEntries(
        availableColumns.map(name => [name, [...(table.data.getChild(name) || [])]])
      );
      const rowIndices = filterColumnarRowIndices(
        options.predicate,
        columns as never,
        table.data.numRows
      );
      const vectors = Object.fromEntries(
        selectedColumnNames.map(name => {
          const sourceVector = table.data.getChild(name);
          return [
            name,
            arrow.vectorFromArray(
              rowIndices.map(rowIndex => columns[name][rowIndex]),
              sourceVector?.type
            )
          ];
        })
      );
      const schema = new arrow.Schema(
        selectedColumnNames.map(
          name => table.data.schema.fields.find(field => field.name === name)!
        )
      );
      projectedData = new arrow.Table(schema, vectors);
    } else {
      projectedData = table.data.select(selectedColumnNames);
    }
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
    try {
      const arrayBuffer = await this.arrayBufferPromise;
      throwIfAborted(signal);
      return arrayBuffer;
    } catch (error) {
      this.arrayBufferPromise = null;
      throw error;
    }
  }
}

/** Parser-bearing ORC source loader exposed through the explicit source subpath. */
export const ORCSourceLoaderWithParser = {
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

/** Converts an ORC struct footer type into a loaders.gl schema without reading stripes. */
export function createORCSchema(
  rootType: ORCTypeDescription | undefined,
  types: readonly ORCTypeDescription[]
): Schema {
  const fields: Field[] =
    rootType?.fieldNames.map((name, index) => ({
      name,
      type: getORCDataType(
        types[rootType.subtypes[index]]?.kind,
        types[rootType.subtypes[index]],
        types
      ),
      nullable: true,
      metadata: {}
    })) || [];
  return {fields, metadata: {}};
}

/** Maps supported ORC primitive kinds to portable schema data types. */
export function getORCDataType(
  typeId: number | undefined,
  typeDescription?: ORCTypeDescription,
  types: readonly ORCTypeDescription[] = []
): DataType {
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
    case ORCTypeKind.LIST: {
      const childTypeId = typeDescription?.subtypes[0];
      return {
        type: 'list',
        children: [
          {
            name: 'item',
            type: getORCDataType(types[childTypeId ?? 0]?.kind, types[childTypeId ?? 0], types),
            nullable: true,
            metadata: {}
          }
        ]
      };
    }
    case ORCTypeKind.MAP:
      return {
        type: 'map',
        keysSorted: false,
        children:
          typeDescription?.subtypes.map((childTypeId, index) => ({
            name: index === 0 ? 'key' : 'value',
            type: getORCDataType(types[childTypeId]?.kind, types[childTypeId], types),
            nullable: true,
            metadata: {}
          })) || []
      };
    case ORCTypeKind.STRUCT:
      return {
        type: 'struct',
        children:
          typeDescription?.subtypes.map((childTypeId, index) => ({
            name: typeDescription.fieldNames[index] || `field_${index}`,
            type: getORCDataType(types[childTypeId]?.kind, types[childTypeId], types),
            nullable: true,
            metadata: {}
          })) || []
      };
    default:
      return 'utf8';
  }
}

/** Throws the common source cancellation error before metadata or decode work begins. */
function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw new Error('Request aborted');
}
