import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {POTreeLoaderOptions} from './potree-loader';
import type {POTreeNode} from './parsers/parse-potree-hierarchy-chunk';
import {parsePotreeHierarchyChunk} from './parsers/parse-potree-hierarchy-chunk';

/** Potree hierarchy chunk loader */
// @ts-ignore not a valid loader
export const PotreeHierarchyChunkLoader: LoaderWithParser<POTreeNode, never, POTreeLoaderOptions> =
  {
    id: 'potree',
    name: 'potree Hierarchy Chunk',
    extensions: ['hrc'],
    mimeTypes: ['application/octet-stream'],
    // binary potree files have no header bytes, no content test function possible
    // test: ['...'],
    parse: async (arrayBuffer, options) => await parsePotreeHierarchyChunk(arrayBuffer),
    parseSync: (arrayBuffer, options) => parsePotreeHierarchyChunk(arrayBuffer),
    binary: true
  };
