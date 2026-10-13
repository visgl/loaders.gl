// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {POTreeLoaderOptions} from './potree-loader-types';
import type {POTreeNode} from './parsers/parse-potree-hierarchy-chunk';
import {parsePotreeHierarchyChunk} from './parsers/parse-potree-hierarchy-chunk';
import {PotreeHierarchyChunkLoader as PotreeHierarchyChunkLoaderMetadata} from './potree-hierarchy-chunk-loader';

const {
  preload: _PotreeHierarchyChunkLoaderPreload,
  ...PotreeHierarchyChunkLoaderMetadataWithoutPreload
} = PotreeHierarchyChunkLoaderMetadata;

/** Hierarchy page context supplied by a dataset source. */
type PotreeHierarchyOptions = {
  /** Global address, page depth and root spacing. */
  potree?: {rootName?: string; maximumDepth?: number; spacing?: number};
};

/** Potree hierarchy chunk loader */
export const PotreeHierarchyChunkLoaderWithParser = {
  ...PotreeHierarchyChunkLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer, options) =>
    parsePotreeHierarchyChunk(arrayBuffer, (options as PotreeHierarchyOptions)?.potree),
  parseSync: (arrayBuffer, options) =>
    parsePotreeHierarchyChunk(arrayBuffer, (options as PotreeHierarchyOptions)?.potree)
} as const satisfies LoaderWithParser<POTreeNode, never, POTreeLoaderOptions>;
