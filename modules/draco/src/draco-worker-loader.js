export default {
  name: 'DRACO',
  extensions: ['drc'],
  binary: true,
  test: 'DRACO',
  worker: true,
  defaultOptions: {
    /* global __VERSION__ */
    // __VERSION__ is injected by babel-plugin-version-inline
    workerUrl: `https://unpkg.com/@loaders.gl/draco@${__VERSION__}/dist/draco-loader.worker.js`
  }
};
