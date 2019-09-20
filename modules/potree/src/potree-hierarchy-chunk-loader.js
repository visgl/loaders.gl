import {default as parsePotreeHierarchyChunk} from './parsers/parse-potree-hierarchy-chunk';

function parseSync(arrayBuffer, options, url, loader) {
  return parsePotreeHierarchyChunk(arrayBuffer);
}

export default {
  name: 'potree Hierarchy Chunk',
  extensions: ['hrc'],
  mimeType: 'application/octet-stream',
  // binary potree files have no header bytes, no content test function possible
  // test: ['...'],
  parseSync,
  binary: true
};
