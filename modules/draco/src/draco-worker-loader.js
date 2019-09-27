/* global __VERSION__ */
export default {
  name: 'DRACO',
  extensions: ['drc'],
  binary: true,
  test: 'DRACO',
  worker: true,
  defaultOptions: {
    workerUrl: `https://unpkg.com/@loaders.gl/draco@${__VERSION__}/dist/draco-loader.worker.js`
  }
};
