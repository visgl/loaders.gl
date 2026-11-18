// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions} from '@loaders.gl/core/loader-utils';
import type {ParquetKeyRetriever} from './lib/parquet-encryption';

/** Row-level options supported by the TypeScript Parquet reader. */
type ParquetCommonLoaderOptions = {
  /** @deprecated Put the limit in a logical query or pass it to `ParquetSource.read()`. */
  limit?: number;
  /** @deprecated Put the offset in a logical query or pass it to `ParquetSource.read()`. */
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

/** Reader selection and cancellation settings. */
type ParquetReaderOptions = ParquetCommonLoaderOptions & {
  /** Zero-based row groups to read, in output order. */
  rowGroups?: number[];
  concurrency?: number;
  /** Cancels an active worker parse by terminating its worker. */
  signal?: AbortSignal;
  /** Overrides the packaged Parquet worker asset URL. */
  workerUrl?: string;
};

/** Public options for the TypeScript-backed `ParquetLoader` and `GeoParquetLoader`. */
export type ParquetLoaderOptions = LoaderOptions & {
  parquet?: {
    shape?: 'arrow' | 'object-row-table';
  } & {
    [Key in keyof ParquetReaderOptions]?: ParquetReaderOptions[Key];
  };
};

/** Shared default option bag for the public Parquet loaders. */
export const PARQUET_LOADER_DEFAULT_OPTIONS = {
  columns: undefined,
  preserveBinary: false,
  shape: 'arrow'
} as const;
