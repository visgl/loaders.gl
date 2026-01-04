// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  mergeOptions,
  type Loader,
  type LoaderOptions,
  type LoaderWithParser
} from '@loaders.gl/loader-utils';
import type {PCDMesh} from './lib/pcd-types';
import {parsePCD, type ParsePCDOptions} from './lib/parse-pcd';
import {PCDFormat} from './pcd-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type PCDLoaderOptions = LoaderOptions & {
  pcd?: {
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
    /** Normalize colors to 0-1 floats instead of 0-255 integers. */
    normalizeColors?: boolean;
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
    pcd: {
      normalizeColors: false
    }
  }
} as const satisfies Loader<PCDMesh, never, PCDLoaderOptions>;

export function normalizePCDLoaderOptions(options?: PCDLoaderOptions): ParsePCDOptions {
  const mergedOptions = mergeOptions(PCDWorkerLoader.options, options ?? {}) as PCDLoaderOptions;
  const normalizeColors =
    mergedOptions.mesh?.normalizeColors ?? mergedOptions.pcd?.normalizeColors ?? false;
  return {
    normalizeColors
  };
}

/**
 * Loader for PCD - Point Cloud Data
 */
export const PCDLoader = {
  ...PCDWorkerLoader,
  parse: async (arrayBuffer, options) =>
    parsePCD(arrayBuffer, normalizePCDLoaderOptions(options)),
  parseSync: (arrayBuffer, options) => parsePCD(arrayBuffer, normalizePCDLoaderOptions(options))
} as const satisfies LoaderWithParser<PCDMesh, never, PCDLoaderOptions>;
