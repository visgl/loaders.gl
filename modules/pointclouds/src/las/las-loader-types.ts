// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LASSource, LASSourceOptions} from './las-source';
import type {CoreAPI, Loader} from '@loaders.gl/core/loader-utils';
import type {Table, RecordBatch} from 'apache-arrow';
import type {LASMesh} from './lib/las-types';
import {LAS_LOADER_METADATA, LAS_SOURCE_METADATA, type LASLoaderOptions} from './las-loader-shared';

export type {LASSourceOptions} from './las-source';

export type {LASColumnName, LASLoaderOptions} from './las-loader-shared';

/** Preloads the parser-bearing primary TypeScript LAS loader implementation. */
async function preload() {
  const {LASLoaderWithParser} = await import('@loaders.gl/pointclouds/las/parser');
  return LASLoaderWithParser;
}

/** Metadata-only loader for the LAS (LASer) point cloud format. */
export const LASLoader = {
  ...LAS_LOADER_METADATA,
  fetchBeforePreload: true,
  worker: true,
  workerInBatches: true,
  preload,
  ...LAS_SOURCE_METADATA,
  /** Creates a source after the parser implementation has been preloaded. */
  createDataSourceSync(
    _data: string | Blob,
    _options: LASSourceOptions,
    _coreApi?: CoreAPI
  ): LASSource {
    throw new Error('Call preload(LASLoader) before creating a source synchronously.');
  }
} as const satisfies Loader<LASMesh | Table, LASMesh | RecordBatch, LASLoaderOptions, LASSource>;
