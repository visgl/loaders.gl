/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** @type {LoaderObject} */
export default {
  id: 'potree',
  name: 'potree',
  version: VERSION,
  extensions: ['json'],
  testText: text => text.indexOf('octreeDir') >= 0,
  parseTextSync: JSON.parse
};
