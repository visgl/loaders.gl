// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import type {PCDMesh} from './lib/pcd-types';
import {PCDFormat} from './pcd-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type PCDLoaderOptions = LoaderOptions & {
  pcd?: {
    /** Output shape. Defaults to a legacy PointCloud object. */
    shape?: 'mesh' | 'arrow-table';
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/**
 * Preloads the parser-bearing PCD loader implementation.
 */
async function preload() {
  const {PCDLoaderWithParser} = await import('./pcd-loader-with-parser');
  return PCDLoaderWithParser;
}

/**
 * Metadata-only worker loader for PCD - Point Cloud Data
 */
export const PCDWorkerLoader = {
  ...PCDFormat,
  dataType: null as unknown as PCDMesh | MeshArrowTable,
  batchType: null as never,
  version: VERSION,
  worker: true,
  options: {
    pcd: {}
  },
  preload
} as const satisfies Loader<PCDMesh | MeshArrowTable, never, PCDLoaderOptions>;

/**
 * Metadata-only loader for PCD - Point Cloud Data
 */
export const PCDLoader = {
  ...PCDWorkerLoader
} as const satisfies Loader<PCDMesh | MeshArrowTable, never, PCDLoaderOptions>;
