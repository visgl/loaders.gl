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
  }>;
  remove?: Readonly<{path: string}>;
}>;

/** Options for reading one Delta commit log as a snapshot. */
export type DeltaSourceOptions = ParquetDatasetSourceOptions & {
  delta?: {version?: number; baseUrl?: string};
};

/** Query options accepted by a Delta snapshot scan. */
export type DeltaScanOptions = ParquetDatasetReadOptions & {version?: number};
