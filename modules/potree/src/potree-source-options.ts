// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DataSourceOptions} from '@loaders.gl/loader-utils';

/** Shared source options; range ceilings apply to modern 2.0 datasets. */
export type PotreeSourceLoaderOptions = DataSourceOptions & {
  /** Legacy color storage and modern octree traversal limits. */
  potree?: {
    /** Legacy color storage; default uint8norm. */
    colorFormat?: 'uint8norm' | 'float16' | 'float32';
    /** Maximum metadata document bytes; default 1 MiB. */
    maxMetadataBytes?: number;
    /** Aggregate hierarchy page bytes; default 16 MiB. */
    maxHierarchyBytes?: number;
    /** Compressed bytes and declared decoded bytes per tile; default 64 MiB each. */
    maxPointBytes?: number;
    /** Maximum discovered hierarchy entries; default 100000. */
    maxNodes?: number;
    /** Cancellation for the source lifetime. */
    signal?: AbortSignal;
  };
};
