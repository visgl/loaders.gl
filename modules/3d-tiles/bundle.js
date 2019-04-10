/* global window, global */
const moduleExports = require('./src');

const _global = typeof window === 'undefined' ? global : window;
_global.loaders = _global.loaders || {};

module.exports = Object.assign(_global.loaders, moduleExports);
