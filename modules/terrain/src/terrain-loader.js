/* global __VERSION__ */ // __VERSION__ is injected by babel-plugin-version-inline
import loadTerrain from './lib/parse-terrain';

const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const TerrainWorkerLoader = {
  id: 'terrain',
  name: 'Terrain',
  version: VERSION,
  extensions: ['pngraw'],
  mimeType: 'image/png',
  options: {
    terrain: {
      workerUrl: `https://unpkg.com/@loaders.gl/terrain@${VERSION}/dist/terrain-loader.worker.js`
    }
  }
};

export const TerrainLoader = {
  ...TerrainWorkerLoader,
  parse: loadTerrain
};
