// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {POTreeLoaderOptions} from './potree-loader';
import type {POTreeNode} from './parsers/parse-potree-hierarchy-chunk';
import {parsePotreeHierarchyChunk} from './parsers/parse-potree-hierarchy-chunk';

/** Potree hierarchy chunk loader */
// @ts-ignore not a valid loader
export const PotreeHierarchyChunkLoader = {
  dataType: null as unknown as POTreeNode,
  batchType: null as never,

  id: 'potree',
  name: 'potree Hierarchy Chunk',
  extensions: ['hrc'],
  mimeTypes: ['application/octet-stream'],
  // binary potree files have no header bytes, no content test function possible
  // test: ['...'],
  parse: async (arrayBuffer, options) => parsePotreeHierarchyChunk(arrayBuffer),
  parseSync: (arrayBuffer, options) => parsePotreeHierarchyChunk(arrayBuffer),
  binary: true
  // @ts-ignore
} as const satisfies LoaderWithParser<POTreeNode, never, POTreeLoaderOptions>;
