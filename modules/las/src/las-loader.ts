// LASER (LAS) FILE FORMAT

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const DEFAULT_LAS_OPTIONS = {
  las: {
    fp64: false,
    skip: 1,
    colorDepth: 8
  }
};

/**
 * Loader for the LAS (LASer) point cloud format
 */
export const LASLoader = {
  name: 'LAS',
  id: 'las',
  module: 'las',
  version: VERSION,
  worker: true,
  extensions: ['las', 'laz'], // LAZ is the "compressed" flavor of LAS,
  mimeTypes: ['application/octet-stream'], // TODO - text version?
  text: true,
  binary: true,
  tests: ['LAS'],
  options: DEFAULT_LAS_OPTIONS
};
