// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import type {LASMesh} from './lib/las-types';
import {LAS_LOADER_METADATA, type LASLoaderOptions} from './las-loader-shared';

export type {LASLoaderOptions} from './las-loader-shared';

/** Preloads the parser-bearing primary TypeScript LAS loader implementation. */
async function preload() {
  const {LASLoaderWithParser} = await import('@loaders.gl/las/las-loader');
  return LASLoaderWithParser;
}

/** Metadata-only loader for the LAS (LASer) point cloud format. */
export const LASLoader = {
  ...LAS_LOADER_METADATA,
  worker: true,
  preload
} as const satisfies Loader<LASMesh | MeshArrowTable, LASMesh | MeshArrowTable, LASLoaderOptions>;

/** @deprecated Use LASLoader. */
export const LASWorkerLoader = LASLoader;
