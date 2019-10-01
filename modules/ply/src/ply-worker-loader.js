export default {
  name: 'PLY',
  extensions: ['ply'],
  text: true,
  binary: true,
  test: 'ply',
  worker: true,
  defaultOptions: {
    /* global __VERSION__ */
    // __VERSION__ is injected by babel-plugin-version-inline
    workerUrl: `https://unpkg.com/@loaders.gl/ply@${__VERSION__}/dist/ply-loader.worker.js`
  }
};
