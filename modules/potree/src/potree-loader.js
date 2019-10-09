/* global __VERSION__ */ // __VERSION__ is injected by babel-plugin-version-inline
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export default {
  id: 'potree',
  name: 'potree',
  version: VERSION,
  extensions: ['json'],
  testText: text => text.indexOf('octreeDir') >= 0,
  parseTextSync: JSON.parse
};
