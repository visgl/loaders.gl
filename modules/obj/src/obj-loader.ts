// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {Mesh} from '@loaders.gl/schema';
import {OBJFormat} from './obj-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type OBJLoaderOptions = LoaderOptions & {
  obj?: {
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/**
 * Preloads the parser-bearing OBJ loader implementation.
 */
async function preload() {
  const {OBJLoaderWithParser} = await import('./obj-loader-with-parser');
  return OBJLoaderWithParser;
}

/**
 * Metadata-only worker loader for the OBJ geometry format
 */
export const OBJWorkerLoader = {
  ...OBJFormat,

  dataType: null as unknown as Mesh,
  batchType: null as never,
  version: VERSION,
  worker: true,
  text: true,
  testText: testOBJFile,
  options: {
    obj: {}
  },
  preload
} as const satisfies Loader<Mesh, never, OBJLoaderOptions>;

function testOBJFile(text: string): boolean {
  // TODO - There could be comment line first
  return text[0] === 'v';
}

// OBJLoader

/**
 * Metadata-only loader for the OBJ geometry format
 */
export const OBJLoader = {
  ...OBJWorkerLoader
} as const satisfies Loader<Mesh, never, OBJLoaderOptions>;
