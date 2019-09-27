/* global __VERSION__ */
export default {
  name: 'Apache Arrow',
  extensions: ['arrow'],
  mimeType: 'application/octet-stream',
  category: 'table',
  worker: true,
  defaultOptions: {
    workerUrl: `https://unpkg.com/@loaders.gl/arrow@${__VERSION__}/dist/arrow-loader.worker.js`
  }
};
