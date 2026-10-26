// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/core/loader-utils';
import type {MeshArrowTable, ArrowTableBatch} from '@loaders.gl/core/schema';
import type {PCDMesh} from './lib/pcd-types';
import {PCDFormat} from './pcd-format';
import {serializeArrowIPCWorkerResult} from '@loaders.gl/core/schema-utils/arrow-transport';

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
  const {PCDLoaderWithParser} = await import('@loaders.gl/pcd/pcd-loader');
  return PCDLoaderWithParser;
}

/**
 * Metadata-only worker loader for PCD - Point Cloud Data
 */
export const PCDLoader = {
  ...PCDFormat,
  dataType: null as unknown as PCDMesh | MeshArrowTable,
  batchType: null as unknown as PCDMesh | ArrowTableBatch,
  version: VERSION,
  worker: true,
  /** Enables the stateful input/output batch protocol on the built-in worker. */
  workerInBatches: true,
  serializeWorkerResult: serializeArrowIPCWorkerResult,
  options: {
    pcd: {shape: 'arrow-table', colorFormat: 'uint8norm'}
  },
  preload
} as const satisfies Loader<PCDMesh | MeshArrowTable, PCDMesh | ArrowTableBatch, PCDLoaderOptions>;

/** @deprecated Use PCDLoader. */
export const PCDWorkerLoader = PCDLoader;
