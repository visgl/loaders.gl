// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, SourceLoader} from '@loaders.gl/loader-utils';

import {ParquetFormat} from './parquet-format';
import type {ParquetSource} from './parquet-source-loader';
import type {ParquetSourceLoaderOptions} from './parquet-source-types';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Loads the runtime Parquet source implementation from its explicit package subpath. */
async function preloadParquetSourceLoader(): Promise<SourceLoader<ParquetSource>> {
  const {ParquetSourceLoaderWithParser} = await import('@loaders.gl/parquet/parquet-source-loader');
  return ParquetSourceLoaderWithParser;
}

/**
 * Lightweight Parquet source metadata.
 *
 * Use with the async `load()` API, which preloads the implementation, or import the runtime source
 * loader from `@loaders.gl/parquet/parquet-source-loader` for synchronous `createDataSource()`.
 */
export const ParquetSourceLoader = {
  ...ParquetFormat,
  dataType: null as unknown as ParquetSource,
  batchType: null as never,
  name: 'ParquetSourceLoader',
  id: 'parquet-source',
  module: 'parquet',
  version: VERSION,
  type: 'parquet',
  fromUrl: true,
  fromBlob: true,
  options: {
    parquet: {
      rowGroups: undefined,
      columns: undefined,
      batchSize: undefined,
      concurrency: undefined,
      rowGroupFilter: undefined,
      headers: undefined,
      preserveBinary: false,
      onTelemetry: undefined,
      wasmUrl: undefined
    },
    rangeRequests: {
      batchDelayMs: 0,
      maxGapBytes: 0,
      rangeExpansionBytes: 0
    }
  },
  defaultOptions: {
    parquet: {
      rowGroups: undefined!,
      columns: undefined!,
      batchSize: undefined!,
      concurrency: undefined!,
      rowGroupFilter: undefined!,
      headers: undefined!,
      preserveBinary: false,
      onTelemetry: undefined!,
      wasmUrl: undefined!
    },
    rangeRequests: {
      batchDelayMs: 0,
      maxGapBytes: 0,
      rangeExpansionBytes: 0
    }
  },
  testURL: (url: string): boolean => /\.parquet(?:$|[?#])/i.test(url),
  preload: preloadParquetSourceLoader,
  createDataSource(
    _data: string | Blob,
    _options: ParquetSourceLoaderOptions,
    _coreApi?: CoreAPI
  ): ParquetSource {
    throw new Error(
      'ParquetSourceLoader requires async load() or an explicit @loaders.gl/parquet/parquet-source-loader import'
    );
  }
} as const satisfies SourceLoader<ParquetSource>;
