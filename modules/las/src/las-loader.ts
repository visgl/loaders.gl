// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// LASER (LAS) FILE FORMAT
import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {LASMesh} from './lib/las-types';
import {LASFormat} from './las-format';
import {parseLAS} from './lib/parse-las';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type LASLoaderOptions = LoaderOptions & {
  las?: {
    shape?: 'mesh' | 'columnar-table' | 'arrow-table';
    fp64?: boolean;
    skip?: number;
    colorDepth?: number | string;
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
  onProgress?: Function;
};

/**
 * Loader for the LAS (LASer) point cloud format
 * @note Does not support LAS v1.4
 */
export const LASWorkerLoader = {
  ...LASFormat,

  dataType: null as unknown as LASMesh,
  batchType: null as never,

  name: 'LAS',
  id: 'las',
  module: 'las',
  version: VERSION,
  worker: true,
  extensions: ['las', 'laz'], // LAZ is the "compressed" flavor of LAS,
  mimeTypes: ['application/octet-stream'], // TODO - text version?
  text: true,
  binary: true,
  tests: ['LAS'],
  options: {
    las: {
      shape: 'mesh',
      fp64: false,
      skip: 1,
      colorDepth: 8
    }
  }
} as const satisfies Loader<LASMesh, never, LASLoaderOptions>;

/**
 * Loader for the LAS (LASer) point cloud format
 * @note Does not support LAS v1.4
 */
export const LASLoader = {
  ...LASWorkerLoader,
  parse: async (arrayBuffer: ArrayBuffer, options?: LASLoaderOptions) =>
    parseLAS(arrayBuffer, options),
  parseSync: (arrayBuffer: ArrayBuffer, options?: LASLoaderOptions) =>
    parseLAS(arrayBuffer, options)
} as const satisfies LoaderWithParser<LASMesh, never, LASLoaderOptions>;
