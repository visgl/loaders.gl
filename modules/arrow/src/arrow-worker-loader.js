export default {
  name: 'Apache Arrow',
  extensions: ['arrow'],
  mimeType: 'application/octet-stream',
  category: 'table',
  worker: true,
  defaultOptions: {
    /* global __VERSION__ */
    // __VERSION__ is injected by babel-plugin-version-inline
    workerUrl: `https://unpkg.com/@loaders.gl/arrow@${__VERSION__}/dist/arrow-loader.worker.js`
  }
};
