// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions} from '@loaders.gl/loader-utils';
import type {ParquetKeyRetriever} from './lib/parquet-encryption';

/** Shared row-level options supported by both Parquet backends. */
type ParquetCommonLoaderOptions = {
  /** @deprecated Use `_scan.limit` instead. */
  limit?: number;
  offset?: number;
  batchSize?: number;
  /** @deprecated Use `_scan.columns` instead for logical projection. */
  columns?: string[];
  preserveBinary?: boolean;
  /** Resolves modular-encryption keys from file and column key metadata. */
  keyRetriever?: ParquetKeyRetriever;
  /** AAD prefix for encrypted files that intentionally omit it from metadata. */
  aadPrefix?: Uint8Array;
  /** Verify plaintext-footer signatures when present. Enabled by default. */
  verifyFooterSignature?: boolean;
  /** Decode legacy INT96 values as Arrow timestamp-nanosecond values. */
  int96AsTimestamp?: boolean;
};

/** Reader selection, cancellation, and optional WASM backend settings. */
type ParquetWasmLoaderOptions = ParquetCommonLoaderOptions & {
  /** Zero-based row groups to read, in output order. */
  rowGroups?: number[];
  concurrency?: number;
  /** Cancels an active worker parse by terminating its worker. */
  signal?: AbortSignal;
  /** Overrides the packaged Parquet worker asset URL. */
  workerUrl?: string;
  /** Overrides the package-local parquet-wasm binary URL. */
  wasmUrl?: string;
};

/** Public options for the TypeScript-backed `ParquetLoader` and `GeoParquetLoader`. */
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
    [Key in keyof ParquetWasmLoaderOptions]?: ParquetWasmLoaderOptions[Key];
  };
};

/** Shared default option bag for the public Parquet loaders. */
export const PARQUET_LOADER_DEFAULT_OPTIONS = {
  columns: undefined,
  preserveBinary: false,
  shape: 'arrow-table'
} as const;
