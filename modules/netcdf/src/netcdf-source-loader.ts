// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Field, Schema, DataType} from '@loaders.gl/schema';
import type {
  DataSourceOptions,
  ScanQueryMetadata,
  ScanQueryMetadataOptions,
  SourceLoader
} from '@loaders.gl/loader-utils';
import {createScanQueryMetadata, DataSource} from '@loaders.gl/loader-utils';
import {NetCDFFormat} from './netcdf-format';
import {NetCDFReader} from './netcdfjs/netcdf-reader';
import type {NetCDFHeader, NetCDFVariable} from './netcdfjs/netcdf-types';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for a NetCDF source. */
export type NetCDFSourceOptions = DataSourceOptions;

/**
 * Lightweight NetCDF source that exposes the classic-file header to the shared scan UI.
 *
 * The source intentionally performs metadata-only discovery. Data-variable reads and chunked
 * window scans remain format-specific follow-up work, but callers can already use one query
 * panel to inspect variables, dimensions, and source statistics.
 */
export class NetCDFSource extends DataSource<string | Blob, NetCDFSourceOptions> {
  private headerPromise: Promise<{header: NetCDFHeader; byteLength: number}> | null = null;

  /** Creates a source over a NetCDF URL or Blob. */
  constructor(data: string | Blob, options: NetCDFSourceOptions = {}) {
    super(data, options);
  }

  /** Discovers variables and dimensions without decoding data arrays. */
  async getQueryMetadata(options: ScanQueryMetadataOptions = {}): Promise<ScanQueryMetadata> {
    throwIfAborted(options.signal);
    const {header, byteLength} = await this.getHeader(options.signal);
    throwIfAborted(options.signal);
    const fields = header.variables.map(variable => createVariableField(variable, header));
    const schema: Schema = {fields, metadata: createDimensionMetadata(header)};
    return createScanQueryMetadata({
      sourceType: 'netcdf',
      queryType: 'table',
      name: typeof this.data === 'string' ? this.data.split('/').pop() : undefined,
      schema,
      capabilities: {
        table: {
          projection: 'unsupported',
          predicate: 'unsupported',
          limit: 'unsupported',
          streaming: false,
          cancellation: false
        }
      },
      statistics: {
        byteLength,
        rowCount: header.recordDimension.length || undefined
      }
    });
  }

  /** Reads and caches the NetCDF header, preserving abort behavior for each caller. */
  private async getHeader(
    signal?: AbortSignal
  ): Promise<{header: NetCDFHeader; byteLength: number}> {
    throwIfAborted(signal);
    if (!this.headerPromise) {
      this.headerPromise = (
        typeof this.data === 'string'
          ? this.fetch(this.url, {signal}).then(response => {
              if (!response.ok) {
                throw new Error(`NetCDF request failed with status ${response.status}.`);
              }
              return response.arrayBuffer();
            })
          : this.data.arrayBuffer()
      ).then(arrayBuffer => {
        const reader = new NetCDFReader(arrayBuffer);
        return {header: reader.header, byteLength: arrayBuffer.byteLength};
      });
    }
    try {
      const result = await this.headerPromise;
      throwIfAborted(signal);
      return result;
    } catch (error) {
      this.headerPromise = null;
      throw error;
    }
  }
}

/** Parser-bearing source loader for NetCDF metadata scans. */
export const NetCDFSourceLoader = {
  dataType: null as unknown as NetCDFSource,
  batchType: null as never,
  ...NetCDFFormat,
  name: 'NetCDFSourceLoader',
  version: VERSION,
  type: 'netcdf-source',
  fromUrl: true,
  fromBlob: true,
  options: {},
  defaultOptions: {},
  testURL: (url: string): boolean => /\.(?:cdf|nc)(?:$|[?#])/i.test(url),
  createDataSource: (data: string | Blob, options: NetCDFSourceOptions): NetCDFSource =>
    new NetCDFSource(data, options)
} as const satisfies SourceLoader<NetCDFSource>;

/** Maps NetCDF primitive names to portable schema data types. */
function getNetCDFDataType(type: string): DataType {
  switch (type.toLowerCase()) {
    case 'byte':
      return 'int8';
    case 'ubyte':
      return 'uint8';
    case 'short':
      return 'int16';
    case 'ushort':
      return 'uint16';
    case 'int':
      return 'int32';
    case 'uint':
      return 'uint32';
    case 'int64':
      return 'int64';
    case 'uint64':
      return 'uint64';
    case 'float':
      return 'float32';
    case 'double':
      return 'float64';
    case 'char':
    case 'string':
      return 'utf8';
    default:
      return 'binary';
  }
}

/** Converts a NetCDF variable into a query-visible field. */
function createVariableField(variable: NetCDFVariable, header: NetCDFHeader): Field {
  const dimensions = variable.dimensions
    .map(dimensionId => header.dimensions[dimensionId])
    .filter(Boolean)
    .map(dimension => `${dimension.name}[${dimension.size}]`)
    .join(',');
  const metadata: Record<string, string> = {dimensions};
  for (const attribute of variable.attributes) {
    metadata[attribute.name] = String(attribute.value);
  }
  return {name: variable.name, type: getNetCDFDataType(variable.type), nullable: true, metadata};
}

/** Adds dimensions as schema metadata so consumers can populate slice controls. */
function createDimensionMetadata(header: NetCDFHeader): Record<string, string> {
  const metadata: Record<string, string> = {};
  for (const dimension of header.dimensions) {
    metadata[`dimension:${dimension.name}`] = String(dimension.size);
  }
  return metadata;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException('The operation was aborted', 'AbortError');
  }
}
