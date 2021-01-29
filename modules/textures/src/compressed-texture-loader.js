/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
/** @typedef {import('@loaders.gl/loader-utils').WorkerLoaderObject} WorkerLoaderObject */

// eslint-disable-next-line import/no-unresolved
import {parseCompressedTexture} from '@loaders.gl/textures/lib/parsers/parse-compressed-texture';
// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

// const PVR_MAGIC_BYTES = [0x03, 0x52, 0x56, 0x50]; // PVR file header magic number

/** @type {WorkerLoaderObject} */
export const CompressedTextureWorkerLoader = {
  id: 'compressed-texture',
  name: 'CompressedTexture',
  version: VERSION,
  extensions: [
    'ktx',
    'ktx2',
    'dds', // WEBGL_compressed_texture_s3tc, WEBGL_compressed_texture_atc
    'pvr' // WEBGL_compressed_texture_pvrtc
  ],
  mimeTypes: ['application/octet-stream', 'image/vnd-ms.dds', 'image/ktx', 'image/ktx2'],
  binary: true,
  options: {
    'compressed-texture': {
      libraryPath: `libs/`
      // workerUrl: `https://unpkg.com/@loaders.gl/textures@${VERSION}/dist/compressed-texture-loader.worker.js`
    }
  }
};

/** @type {LoaderObject} */
export const CompressedTextureLoader = {
  ...CompressedTextureWorkerLoader,
  parse: async (arrayBuffer, options) => parseCompressedTexture(arrayBuffer)
};
