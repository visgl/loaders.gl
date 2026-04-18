// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions} from '@loaders.gl/loader-utils';

/** Shared parquet loader options for Arrow and plain-JS adapters. */
export type ParquetLoaderOptions = LoaderOptions & {
  parquet?: {
    shape?: 'object-row-table' | 'arrow-table';
    implementation?: 'wasm' | 'js';
    limit?: number;
    offset?: number;
    batchSize?: number;
    columns?: string[];
    rowGroups?: number[];
    concurrency?: number;
    wasmUrl?: string;
    preserveBinary?: boolean;
  };
};

/** Shared default parquet loader options. */
export const PARQUET_LOADER_DEFAULT_OPTIONS = {
  columns: undefined,
  implementation: 'wasm',
  preserveBinary: false,
  shape: 'object-row-table'
} as const;
