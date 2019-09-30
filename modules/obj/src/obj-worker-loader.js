export default {
  name: 'OBJ',
  extensions: ['obj'],
  worker: true,
  defaultOptions: {
    /* global __VERSION__ */
    // __VERSION__ is injected by babel-plugin-version-inline
    workerUrl: `https://unpkg.com/@loaders.gl/obj@${__VERSION__}/dist/obj-loader.worker.js`
  }
};
