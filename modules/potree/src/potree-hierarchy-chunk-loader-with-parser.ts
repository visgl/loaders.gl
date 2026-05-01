// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {POTreeLoaderOptions} from './potree-loader';
import type {POTreeNode} from './parsers/parse-potree-hierarchy-chunk';
import {parsePotreeHierarchyChunk} from './parsers/parse-potree-hierarchy-chunk';
import {PotreeHierarchyChunkLoader as PotreeHierarchyChunkLoaderMetadata} from './potree-hierarchy-chunk-loader';

const {
  preload: _PotreeHierarchyChunkLoaderPreload,
  ...PotreeHierarchyChunkLoaderMetadataWithoutPreload
} = PotreeHierarchyChunkLoaderMetadata;

/** Potree hierarchy chunk loader */
export const PotreeHierarchyChunkLoaderWithParser = {
  ...PotreeHierarchyChunkLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer, options) => parsePotreeHierarchyChunk(arrayBuffer),
  parseSync: (arrayBuffer, options) => parsePotreeHierarchyChunk(arrayBuffer)
} as const satisfies LoaderWithParser<POTreeNode, never, POTreeLoaderOptions>;
