/* global __VERSION__ */
export default {
  name: 'PCD',
  extensions: ['pcd'],
  worker: true,
  defaultOptions: {
    workerUrl: `https://unpkg.com/@loaders.gl/pcd@${__VERSION__}/dist/pcd-loader.worker.js`
  }
};
