// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {POTreeLoaderOptions} from './potree-loader';
import type {POTreeNode} from './parsers/parse-potree-hierarchy-chunk';
import {parsePotreeHierarchyChunk} from './parsers/parse-potree-hierarchy-chunk';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Potree hierarchy chunk loader */
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
  parse: async (arrayBuffer, options) => parsePotreeHierarchyChunk(arrayBuffer),
  parseSync: (arrayBuffer, options) => parsePotreeHierarchyChunk(arrayBuffer),
  options: {
    potree: {}
  },
  binary: true
} as const satisfies LoaderWithParser<POTreeNode, never, POTreeLoaderOptions>;
