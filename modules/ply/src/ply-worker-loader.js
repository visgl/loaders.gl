/* global __VERSION__ */
export default {
  name: 'PLY',
  extensions: ['ply'],
  text: true,
  binary: true,
  test: 'ply',
  worker: true,
  defaultOptions: {
    workerUrl: `https://unpkg.com/@loaders.gl/ply@${__VERSION__}/dist/ply-loader.worker.js`
  }
};
