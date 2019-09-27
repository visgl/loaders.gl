/* global __VERSION__ */
export default {
  name: 'LAZ',
  extensions: ['las', 'laz'],
  worker: true,
  defaultOptions: {
    workerUrl: `https://unpkg.com/@loaders.gl/las@${__VERSION__}/dist/las-loader.worker.js`
  }
};
