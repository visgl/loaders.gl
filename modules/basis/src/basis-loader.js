// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */
import parseBasis from './lib/parse-basis';

const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const BasisWorkerLoader = {
  id: 'basis',
  name: 'Basis',
  version: VERSION,
  extensions: ['basis'],
  mimeType: 'application/octet-stream',
  binary: true,
  options: {
    basis: {
      libraryPath: `libs/`,
      // workerUrl: `https://unpkg.com/@loaders.gl/basis@${VERSION}/dist/basis-loader.worker.js`
    }
  }
};

export const BasisLoader = {
  ...BasisWorkerLoader,
  parse: parseBasis
};
