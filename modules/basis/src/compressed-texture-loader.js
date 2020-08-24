/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
/** @typedef {import('@loaders.gl/loader-utils').WorkerLoaderObject} WorkerLoaderObject */

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const PVR_MAGIC_BYTES = [0x03, 0x52, 0x56, 0x50]; // PVR file header magic number

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
  tests: [new Uint8Array(PVR_MAGIC_BYTES).buffer],
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
