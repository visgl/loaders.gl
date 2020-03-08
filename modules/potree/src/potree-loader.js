// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export default {
  id: 'potree',
  name: 'potree',
  version: VERSION,
  extensions: ['json'],
  testText: text => text.indexOf('octreeDir') >= 0,
  parseTextSync: JSON.parse
};
