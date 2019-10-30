// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */
import parseBasis from './lib/parse-basis';

const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const BasisWorkerLoader = {
  id: 'basis',
  name: 'Basis',
  version: VERSION,
  extensions: ['basis'],
  test: 'sB',
  mimeType: 'application/octet-stream',
  binary: true,
  options: {
    basis: {
      libraryPath: `libs/`
      // workerUrl: `https://unpkg.com/@loaders.gl/basis@${VERSION}/dist/basis-loader.worker.js`
    }
  }
};

export const BasisLoader = {
  ...BasisWorkerLoader,
  parse: parseBasis
};

export const BasisFormat = {
  /* eslint-disable camelcase */
  cTFETC1: 0,
  cTFETC2: 1,
  cTFBC1: 2,
  cTFBC3: 3,
  cTFBC4: 4,
  cTFBC5: 5,
  cTFBC7_M6_OPAQUE_ONLY: 6,
  cTFBC7_M5: 7,
  cTFPVRTC1_4_RGB: 8,
  cTFPVRTC1_4_RGBA: 9,
  cTFASTC_4x4: 10,
  cTFATC_RGB: 11,
  cTFATC_RGBA_INTERPOLATED_ALPHA: 12,
  cTFRGBA32: 13,
  cTFRGB565: 14,
  cTFBGR565: 15,
  cTFRGBA4444: 16
  /* eslint-enable camelcase */
};
