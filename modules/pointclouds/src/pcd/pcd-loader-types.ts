// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table, RecordBatch} from 'apache-arrow';
import type {Loader, LoaderOptions} from '@loaders.gl/core/loader-utils';
import type {PCDMesh} from './lib/pcd-types';
import {PCDFormat} from './pcd-format';
import {serializeArrowWorkerTable} from '@loaders.gl/core/arrow-worker-transport';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type PCDLoaderOptions = LoaderOptions & {
  pcd?: {
    /** Output shape. Defaults to a Mesh Arrow table. */
    shape?: 'mesh' | 'arrow';
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
  const {PCDLoaderWithParser} = await import('@loaders.gl/pointclouds/pcd-loader');
  return PCDLoaderWithParser;
}

/**
 * Metadata-only worker loader for PCD - Point Cloud Data
 */
export const PCDLoader = {
  defaultShape: 'arrow',
  supportsNativeArrow: true,
  ...PCDFormat,
  dataType: null as unknown as PCDMesh | Table,
  batchType: null as unknown as PCDMesh | RecordBatch,
  version: VERSION,
  worker: true,
  /** Enables the stateful input/output batch protocol on the built-in worker. */
  workerInBatches: true,
  serializeWorkerResult: serializeArrowWorkerTable,
  options: {
    pcd: {shape: 'arrow', colorFormat: 'uint8norm'}
  },
  preload
} as const satisfies Loader<PCDMesh | Table, PCDMesh | RecordBatch, PCDLoaderOptions>;
