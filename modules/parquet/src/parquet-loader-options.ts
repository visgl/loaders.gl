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
  /** Cancels an active worker parse by terminating its worker. */
  signal?: AbortSignal;
  /** Overrides the packaged Parquet worker asset URL. */
  workerUrl?: string;
  /** Overrides the package-local parquet-wasm binary URL. */
  wasmUrl?: string;
};

/** Public options for the wasm-backed `ParquetLoader` and `GeoParquetLoader`. */
export type ParquetLoaderOptions = LoaderOptions & {
  parquet?: {
    shape?: 'object-row-table' | 'arrow-table';
  } & {
    [Key in keyof ParquetWasmLoaderOptions]?: ParquetWasmLoaderOptions[Key];
  };
};

/** Public options for the experimental parquetjs-backed `ParquetJSLoader`. */
export type ParquetJSLoaderOptions = LoaderOptions & {
  parquet?: {
    shape?: 'object-row-table' | 'arrow-table';
  } & {
    [Key in keyof ParquetCommonLoaderOptions]?: ParquetCommonLoaderOptions[Key];
  };
};

/** Shared default option bag for the wasm-backed Parquet loaders. */
export const PARQUET_LOADER_DEFAULT_OPTIONS = {
  columns: undefined,
  preserveBinary: false,
  shape: 'object-row-table'
} as const;
