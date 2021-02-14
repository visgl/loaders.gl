/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
import {default as parsePotreeHierarchyChunk} from './parsers/parse-potree-hierarchy-chunk';

function parseSync(arrayBuffer, options, url, loader) {
  return parsePotreeHierarchyChunk(arrayBuffer);
}

/** @type {LoaderObject} */
// @ts-ignore
export const PotreeHierarchyChunkLoader = {
  id: 'potree',
  name: 'potree Hierarchy Chunk',
  extensions: ['hrc'],
  mimeTypes: ['application/octet-stream'],
  // binary potree files have no header bytes, no content test function possible
  // test: ['...'],
  parse: async arrayBuffer => await parseSync(arrayBuffer),
  parseSync,
  binary: true
};
