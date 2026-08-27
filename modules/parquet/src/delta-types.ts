// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ParquetDatasetSourceOptions, ParquetDatasetReadOptions} from './parquet-source-types';

/** One Delta Lake transaction action from a commit log or checkpoint projection. */
export type DeltaAction = Readonly<{
  add?: Readonly<{
    path: string;
    size?: number;
    partitionValues?: Readonly<Record<string, string | null>>;
    stats?: string | Readonly<Record<string, unknown>>;
    /** Delta deletion-vector descriptor, which is not decoded by this source. */
    deletionVector?: unknown;
  }>;
  remove?: Readonly<{path: string}>;
}>;

/** Options for reading a Delta snapshot from its newline-delimited commit log. */
export type DeltaSourceOptions = ParquetDatasetSourceOptions & {
  delta?: {
    /** Snapshot version to replay when the source is a commit-log URL. */
    version?: number;
    /** Table root used to resolve relative Parquet add-file paths. */
    baseUrl?: string;
    /** Headers sent while reading commit-log files. */
    headers?: HeadersInit;
  };
};

/** Query options accepted by a Delta snapshot scan. */
export type DeltaScanOptions = ParquetDatasetReadOptions & {version?: number};
