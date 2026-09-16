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
    /** Output shape. Defaults to a Mesh Arrow table. */
    shape?: 'mesh' | 'arrow-table';
    /** Color storage format. Defaults to uint8norm for backwards compatibility. */
    colorFormat?: 'uint8norm' | 'float16' | 'float32';
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
export const PCDLoader = {
  ...PCDFormat,
  dataType: null as unknown as PCDMesh | MeshArrowTable,
  batchType: null as never,
  version: VERSION,
  worker: true,
  options: {
    pcd: {shape: 'arrow-table', colorFormat: 'uint8norm'}
  },
  preload
} as const satisfies Loader<PCDMesh | MeshArrowTable, never, PCDLoaderOptions>;

/** @deprecated Use PCDLoader. */
export const PCDWorkerLoader = PCDLoader;
