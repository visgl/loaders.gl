// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// PLY Loader
import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {PLYMesh} from './lib/ply-types';
import type {ParsePLYOptions} from './lib/parse-ply';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type PLYLoaderOptions = LoaderOptions & {
  ply?: ParsePLYOptions & {
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/**
 * Preloads the parser-bearing PLY loader implementation.
 */
async function preload() {
  const {PLYLoaderWithParser} = await import('./ply-loader-with-parser');
  return PLYLoaderWithParser;
}

/**
 * Metadata-only worker loader for PLY - Polygon File Format (aka Stanford Triangle Format)'
 * links: ['http://paulbourke.net/dataformats/ply/',
 * 'https://en.wikipedia.org/wiki/PLY_(file_format)']
 */
export const PLYWorkerLoader = {
  dataType: null as unknown as PLYMesh,
  batchType: null as never,

  name: 'PLY',
  id: 'ply',
  module: 'ply',
  // shapes: ['mesh', 'gltf', 'columnar-table'],
  version: VERSION,
  worker: true,
  extensions: ['ply'],
  mimeTypes: ['text/plain', 'application/octet-stream'],
  text: true,
  binary: true,
  tests: ['ply'],
  options: {
    ply: {}
  },
  preload
} as const satisfies Loader<PLYMesh, never, LoaderOptions>;

/**
 * Metadata-only loader for PLY - Polygon File Format
 */
export const PLYLoader = {
  ...PLYWorkerLoader
} as const satisfies Loader<PLYMesh, any, PLYLoaderOptions>;
