/* global __VERSION__ */ // __VERSION__ is injected by babel-plugin-version-inline
export default {
  id: 'potree',
  name: 'potree',
  version: __VERSION__,
  extensions: ['json'],
  testText: text => text.indexOf('octreeDir') >= 0,
  parseTextSync: JSON.parse
};
