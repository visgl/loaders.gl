// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const CompressedTextureWorkerLoader = {
  id: 'basis',
  name: 'CompressedTexture',
  version: VERSION,
  extensions: [
    'dds', // WEBGL_compressed_texture_s3tc, WEBGL_compressed_texture_atc
    'pvr' // WEBGL_compressed_texture_pvrtc
  ],
  mimeType: 'application/octet-stream',
  test: 0x03525650, // PVR magic number
  binary: true,
  options: {
    basis: {
      libraryPath: `libs/`
      // workerUrl: `https://unpkg.com/@loaders.gl/basis@${VERSION}/dist/basis-loader.worker.js`
    }
  }
};

export const CompressedTextureLoader = {
  ...CompressedTextureWorkerLoader,
  parse: async (arrayBuffer, options) => arrayBuffer
};
