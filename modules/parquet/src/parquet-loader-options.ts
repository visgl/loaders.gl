// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions} from '@loaders.gl/loader-utils';

type ParquetCommonLoaderOptions = {
  limit?: number;
  offset?: number;
  batchSize?: number;
  columns?: string[];
  preserveBinary?: boolean;
};

type ParquetWasmLoaderOptions = ParquetCommonLoaderOptions & {
  rowGroups?: number[];
  concurrency?: number;
  wasmUrl?: string;
};

type ParquetInternalLoaderOptions = ParquetWasmLoaderOptions & {
  implementation?: 'wasm' | 'js';
};

/** Public options for the wasm-backed Parquet loaders. */
export type ParquetLoaderOptions = LoaderOptions & {
  parquet?: {
    [Key in keyof ParquetWasmLoaderOptions]?: ParquetWasmLoaderOptions[Key];
  };
};

/** Public options for the parquetjs-backed plain-row loader. */
export type ParquetJSLoaderOptions = LoaderOptions & {
  parquet?: {
    [Key in keyof ParquetCommonLoaderOptions]?: ParquetCommonLoaderOptions[Key];
  };
};

/** Internal options that retain backend selection for shared helpers. */
export type ParquetLoaderImplementationOptions = LoaderOptions & {
  parquet?: {
    [Key in keyof ParquetInternalLoaderOptions]?: ParquetInternalLoaderOptions[Key];
  };
};
