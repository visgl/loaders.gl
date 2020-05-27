// description: 'PLY - Polygon File Format (aka Stanford Triangle Format)'
// links: ['http://paulbourke.net/dataformats/ply/',
// 'https://en.wikipedia.org/wiki/PLY_(file_format)']

// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */
import parsePLY from './lib/parse-ply';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const PLYWorkerLoader = {
  id: 'ply',
  name: 'PLY',
  version: VERSION,
  extensions: ['ply'],
  mimeType: 'text/plain',
  // mimeType: 'application/octet-stream', TODO - binary version?
  text: true,
  binary: true,
  test: 'ply',
  options: {
    ply: {
      workerUrl: `https://unpkg.com/@loaders.gl/ply@${VERSION}/dist/ply-loader.worker.js`
    }
  }
};

export const PLYLoader = {
  ...PLYWorkerLoader,
  // Note: parsePLY supports both text and binary
  parse: async (arrayBuffer, options) => parsePLY(arrayBuffer, options), // TODO - this may not detect text correctly?
  parseTextSync: parsePLY,
  parseSync: parsePLY,
  parseInBatches: parsePLYInBatches,
};
