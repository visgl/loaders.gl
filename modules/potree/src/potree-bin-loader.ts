// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {Mesh} from '@loaders.gl/schema';
import {parsePotreeBin, type PotreeBinLoaderOptions} from './parsers/parse-potree-bin';

export type {PotreeBinLoaderOptions} from './parsers/parse-potree-bin';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Loader for potree Binary Point Attributes
 * */
export const PotreeBinLoader = {
  dataType: null as unknown as Mesh,
  batchType: null as never,

  name: 'potree Binary Point Attributes',
  id: 'potree',
  module: 'potree',
  version: VERSION,
  extensions: ['bin'],
  mimeTypes: ['application/octet-stream'],
  // Unfortunately binary potree files have no header bytes, no test possible
  // test: ['...'],
  parse,
  parseSync,
  binary: true,
  options: {}
  // @ts-ignore
} as const satisfies LoaderWithParser<Mesh, never, PotreeBinLoaderOptions>;

/**
 * Parse a Potree binary node into a mesh.
 */
async function parse(arrayBuffer: ArrayBuffer, options?: PotreeBinLoaderOptions): Promise<Mesh> {
  return parseSync(arrayBuffer, options);
}

/**
 * Parse a Potree binary node into a mesh.
 */
function parseSync(arrayBuffer: ArrayBuffer, options?: PotreeBinLoaderOptions): Mesh {
  return parsePotreeBin(arrayBuffer, 0, options);
}
