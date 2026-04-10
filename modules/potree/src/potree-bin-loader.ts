// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {parsePotreeBin} from './parsers/parse-potree-bin';

/**
 * Loader for potree Binary Point Attributes
 * */
export const PotreeBinLoader = {
  dataType: null as unknown as {},
  batchType: null as never,

  name: 'potree Binary Point Attributes',
  id: 'potree',
  extensions: ['bin'],
  mimeTypes: ['application/octet-stream'],
  // Unfortunately binary potree files have no header bytes, no test possible
  // test: ['...'],
  parseSync,
  binary: true,
  options: {}
  // @ts-ignore
} as const satisfies LoaderWithParser<{}, never, LoaderOptions>;

function parseSync(arrayBuffer: ArrayBuffer, options?: LoaderOptions): {} {
  const index = {};
  const byteOffset = 0;
  parsePotreeBin(arrayBuffer, byteOffset, options, index);
  return index;
}
