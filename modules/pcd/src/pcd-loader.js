import parsePCDSync from './lib/parse-pcd';

const PCD = {
  id: 'pcd',
  name: 'PCD',
  extensions: ['pcd'],
  mimeType: 'text/plain'
};

export const PCDLoader = {
  ...PCD,
  parse: async (arrayBuffer, options) => parsePCDSync(arrayBuffer, options),
  parseSync: parsePCDSync,
  options: {
    pcd: {}
  }
};

export const PCDWorkerLoader = {
  ...PCD,
  options: {
    pcd: {
      workerUrl: `https://unpkg.com/@loaders.gl/pcd@${__VERSION__}/dist/pcd-loader.worker.js`
    }
  }
};
