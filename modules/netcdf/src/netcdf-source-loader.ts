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
  private static readonly HEADER_RANGE_SIZE = 64 * 1024;
  private static readonly MAX_HEADER_RANGE_SIZE = 4 * 1024 * 1024;
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
      queryType: 'raster',
      name: typeof this.data === 'string' ? this.data.split('/').pop() : undefined,
      schema,
      capabilities: {
        bounds: 'unsupported',
        levelOfDetail: 'unsupported'
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
      this.headerPromise = this.loadHeader().catch(error => {
        this.headerPromise = null;
        throw error;
      });
    }
    const result = await this.headerPromise;
    throwIfAborted(signal);
    return result;
  }

  /** Loads enough leading bytes to parse a remote header, growing ranges when required. */
  private async loadHeader(): Promise<{header: NetCDFHeader; byteLength: number}> {
    if (typeof this.data !== 'string') {
      const arrayBuffer = await this.data.arrayBuffer();
      return {header: new NetCDFReader(arrayBuffer).header, byteLength: arrayBuffer.byteLength};
    }

    let rangeSize = NetCDFSource.HEADER_RANGE_SIZE;
    let response: Response | null = null;
    let arrayBuffer: ArrayBuffer | null = null;
    let lastError: unknown;
    while (rangeSize <= NetCDFSource.MAX_HEADER_RANGE_SIZE) {
      response = await this.fetch(this.url, {
        headers: {Range: `bytes=0-${rangeSize - 1}`}
      });
      if (!response.ok) throw new Error(`NetCDF request failed with status ${response.status}.`);
      arrayBuffer = await response.arrayBuffer();
      const byteLength = getResponseByteLength(response, arrayBuffer.byteLength);
      try {
        return {header: new NetCDFReader(arrayBuffer).header, byteLength};
      } catch (error) {
        lastError = error;
        if (response.status !== 206 || arrayBuffer.byteLength < rangeSize) throw error;
        rangeSize *= 2;
      }
    }
    throw lastError || new Error('NetCDF header exceeds the maximum metadata range.');
  }
}

/** Parser-bearing source loader for NetCDF metadata scans. */
export const NetCDFSourceLoaderWithParser = {
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

/** Backwards-compatible implementation-loader alias for explicit subpath imports. */
export const NetCDFSourceLoader = NetCDFSourceLoaderWithParser;

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
    .map(
      (dimension, index) =>
        `${dimension.name}[${getDimensionSize(header, variable.dimensions[index])}]`
    )
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
  for (const [dimensionId, dimension] of header.dimensions.entries()) {
    metadata[`dimension:${dimension.name}`] = String(getDimensionSize(header, dimensionId));
  }
  return metadata;
}

function getDimensionSize(header: NetCDFHeader, dimensionId: number): number {
  const dimension = header.dimensions[dimensionId];
  return dimensionId === header.recordDimension.id
    ? header.recordDimension.length
    : dimension?.size || 0;
}

function getResponseByteLength(response: Response, fallback: number): number {
  const contentRange = response.headers.get('content-range');
  const total = contentRange?.match(/\/([0-9]+)$/)?.[1];
  return Number(total || response.headers.get('content-length') || fallback);
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException('The operation was aborted', 'AbortError');
  }
}
