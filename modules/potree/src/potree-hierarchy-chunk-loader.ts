// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {POTreeLoaderOptions} from './potree-loader';
import type {POTreeNode} from './parsers/parse-potree-hierarchy-chunk';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Preloads the parser-bearing Potree hierarchy chunk loader implementation. */
async function preload() {
  const {PotreeHierarchyChunkLoaderWithParser} = await import(
    './potree-hierarchy-chunk-loader-with-parser'
  );
  return PotreeHierarchyChunkLoaderWithParser;
}

/** Metadata-only Potree hierarchy chunk loader. */
export const PotreeHierarchyChunkLoader = {
  dataType: null as unknown as POTreeNode,
  batchType: null as never,

  name: 'potree Hierarchy Chunk',
  id: 'potree-hrc',
  module: 'potree',
  version: VERSION,
  extensions: ['hrc'],
  mimeTypes: ['application/octet-stream'],
  // binary potree files have no header bytes, no content test function possible
  // test: ['...'],
  options: {
    potree: {}
  },
  binary: true,
  preload
} as const satisfies Loader<POTreeNode, never, POTreeLoaderOptions>;
