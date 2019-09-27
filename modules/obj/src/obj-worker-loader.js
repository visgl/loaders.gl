/* global __VERSION__ */
export default {
  name: 'OBJ',
  extensions: ['obj'],
  worker: true,
  defaultOptions: {
    workerUrl: `https://unpkg.com/@loaders.gl/obj@${__VERSION__}/dist/obj-loader.worker.js`
  }
};
