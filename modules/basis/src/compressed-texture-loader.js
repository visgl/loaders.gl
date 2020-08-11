/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
/** @typedef {import('@loaders.gl/loader-utils').WorkerLoaderObject} WorkerLoaderObject */

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** @type {WorkerLoaderObject} */
export const CompressedTextureWorkerLoader = {
  id: 'basis',
  name: 'CompressedTexture',
  version: VERSION,
  extensions: [
    'dds', // WEBGL_compressed_texture_s3tc, WEBGL_compressed_texture_atc
    'pvr' // WEBGL_compressed_texture_pvrtc
  ],
  mimeTypes: ['application/octet-stream'],
  test: 0x03525650, // PVR magic number
  binary: true,
  options: {
    basis: {
      libraryPath: `libs/`
      // workerUrl: `https://unpkg.com/@loaders.gl/basis@${VERSION}/dist/basis-loader.worker.js`
    }
  }
};

/** @type {LoaderObject} */
export const CompressedTextureLoader = {
  ...CompressedTextureWorkerLoader,
  parse: async (arrayBuffer, options) => arrayBuffer
};
