// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {PCDMesh} from './lib/pcd-types';
import {parsePCD} from './lib/parse-pcd';
import {PCDFormat} from './pcd-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type PCDLoaderOptions = LoaderOptions & {
  pcd?: {
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/**
 * Worker loader for PCD - Point Cloud Data
 */
export const PCDWorkerLoader = {
  ...PCDFormat,
  dataType: null as unknown as PCDMesh,
  batchType: null as never,
  version: VERSION,
  worker: true,
  options: {
    pcd: {}
  }
} as const satisfies Loader<PCDMesh, never, PCDLoaderOptions>;

/**
 * Loader for PCD - Point Cloud Data
 */
export const PCDLoader = {
  ...PCDWorkerLoader,
  parse: async (arrayBuffer) => parsePCD(arrayBuffer),
  parseSync: parsePCD
} as const satisfies LoaderWithParser<PCDMesh, never, LoaderOptions>;
