// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/core/loader-utils';
import type {Table, RecordBatch} from 'apache-arrow';
import type {LASMesh} from './lib/las-types';
import {LAS_LOADER_METADATA, type LASLoaderOptions} from './las-loader-shared';

export type {LASColumnName, LASLoaderOptions} from './las-loader-shared';

/** Preloads the parser-bearing primary TypeScript LAS loader implementation. */
async function preload() {
  const {LASLoaderWithParser} = await import('@loaders.gl/pointclouds/las-loader');
  return LASLoaderWithParser;
}

/** Metadata-only loader for the LAS (LASer) point cloud format. */
export const LASLoader = {
  ...LAS_LOADER_METADATA,
  worker: true,
  workerInBatches: true,
  preload
} as const satisfies Loader<LASMesh | Table, LASMesh | RecordBatch, LASLoaderOptions>;
