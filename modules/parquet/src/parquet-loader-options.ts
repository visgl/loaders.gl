// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions} from '@loaders.gl/loader-utils';

/** Shared row-level options supported by both Parquet backends. */
type ParquetCommonLoaderOptions = {
  limit?: number;
  offset?: number;
  batchSize?: number;
  columns?: string[];
  preserveBinary?: boolean;
};

/** Additional options supported by the wasm-backed Parquet reader. */
type ParquetWasmLoaderOptions = ParquetCommonLoaderOptions & {
  rowGroups?: number[];
  concurrency?: number;
  wasmUrl?: string;
};

/** Internal superset of Parquet loader options that retains backend selection. */
type ParquetInternalLoaderOptions = ParquetWasmLoaderOptions & {
  shape?: 'object-row-table' | 'arrow-table';
  implementation?: 'wasm' | 'js';
};

/** Public options for the wasm-backed `ParquetLoader`, `GeoParquetLoader`, and `ParquetArrowLoader`. */
export type ParquetLoaderOptions = LoaderOptions & {
  parquet?: {shape?: 'object-row-table' | 'arrow-table'; implementation?: 'wasm' | 'js'} & {
    [Key in keyof ParquetWasmLoaderOptions]?: ParquetWasmLoaderOptions[Key];
  };
};

/** Public options for the experimental parquetjs-backed `ParquetJSLoader`. */
export type ParquetJSLoaderOptions = LoaderOptions & {
  parquet?: {
    [Key in keyof ParquetCommonLoaderOptions]?: ParquetCommonLoaderOptions[Key];
  };
};

/** Internal options used by shared Parquet helpers that need backend selection. */
export type ParquetLoaderImplementationOptions = LoaderOptions & {
  parquet?: {
    [Key in keyof ParquetInternalLoaderOptions]?: ParquetInternalLoaderOptions[Key];
  };
};

/** Shared default option bag for the wasm-backed Parquet loaders. */
export const PARQUET_LOADER_DEFAULT_OPTIONS = {
  columns: undefined,
  implementation: 'wasm',
  preserveBinary: false,
  shape: 'object-row-table'
} as const;
