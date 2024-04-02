// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import parsePCDSync from './lib/parse-pcd';
import {PCDLoader as PCDWorkerLoader} from './pcd-loader';
import {PCDMesh} from './lib/pcd-types';

export {PCDWorkerLoader};

/**
 * Loader for PCD - Point Cloud Data
 */
export const PCDLoader = {
  ...PCDWorkerLoader,
  parse: async (arrayBuffer) => parsePCDSync(arrayBuffer),
  parseSync: parsePCDSync
} as const satisfies LoaderWithParser<PCDMesh, never, LoaderOptions>;
