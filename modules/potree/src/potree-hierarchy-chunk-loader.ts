import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {default as parsePotreeHierarchyChunk} from './parsers/parse-potree-hierarchy-chunk';

/** Potree hierarchy chunk loader */
// @ts-ignore
export const PotreeHierarchyChunkLoader: LoaderWithParser = {
  id: 'potree',
  name: 'potree Hierarchy Chunk',
  extensions: ['hrc'],
  mimeTypes: ['application/octet-stream'],
  // binary potree files have no header bytes, no content test function possible
  // test: ['...'],
  parse: async (arrayBuffer, options) => await parseSync(arrayBuffer, options),
  parseSync,
  binary: true
};

function parseSync(arrayBuffer, options) {
  return parsePotreeHierarchyChunk(arrayBuffer);
}
