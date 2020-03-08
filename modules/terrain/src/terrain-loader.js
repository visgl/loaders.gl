// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */
import loadTerrain from './lib/parse-terrain';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const TerrainWorkerLoader = {
  id: 'terrain',
  name: 'Terrain',
  version: VERSION,
  extensions: ['png', 'pngraw'],
  mimeType: 'image/png',
  options: {
    terrain: {
      workerUrl: `https://unpkg.com/@loaders.gl/terrain@${VERSION}/dist/terrain-loader.worker.js`,
      meshMaxError: 10,
      elevationDecoder: {
        rScaler: 1,
        gScaler: 0,
        bScaler: 0,
        offset: 0
      }
    }
  }
};

export const TerrainLoader = {
  ...TerrainWorkerLoader,
  parse: loadTerrain
};
