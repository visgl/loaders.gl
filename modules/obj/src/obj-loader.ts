// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {Mesh} from '@loaders.gl/schema';
import {OBJFormat} from './obj-format';
import {parseOBJ} from './lib/parse-obj';

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
 * Worker loader for the OBJ geometry format
 */
export const OBJWorkerLoader = {
  ...OBJFormat,

  dataType: null as unknown as Mesh,
  batchType: null as never,
  version: VERSION,
  worker: true,
  testText: testOBJFile,
  options: {
    obj: {}
  }
} as const satisfies Loader<Mesh, never, OBJLoaderOptions>;

function testOBJFile(text: string): boolean {
  // TODO - There could be comment line first
  return text[0] === 'v';
}

// OBJLoader

/**
 * Loader for the OBJ geometry format
 */
export const OBJLoader = {
  ...OBJWorkerLoader,
  parse: async (arrayBuffer: ArrayBuffer, options?: OBJLoaderOptions) =>
    parseOBJ(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: OBJLoaderOptions) => parseOBJ(text, options)
} as const satisfies LoaderWithParser<Mesh, never, OBJLoaderOptions>;
