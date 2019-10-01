export default {
  name: 'PCD',
  extensions: ['pcd'],
  worker: true,
  defaultOptions: {
    /* global __VERSION__ */
    // __VERSION__ is injected by babel-plugin-version-inline
    workerUrl: `https://unpkg.com/@loaders.gl/pcd@${__VERSION__}/dist/pcd-loader.worker.js`
  }
};
