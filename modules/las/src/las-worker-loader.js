export default {
  name: 'LAZ',
  extensions: ['las', 'laz'],
  worker: true,
  defaultOptions: {
    /* global __VERSION__ */
    // __VERSION__ is injected by babel-plugin-version-inline
    workerUrl: `https://unpkg.com/@loaders.gl/las@${__VERSION__}/dist/las-loader.worker.js`
  }
};
