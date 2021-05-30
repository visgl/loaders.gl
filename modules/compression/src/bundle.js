// Starts a worker if imported into a browser thread
// require('./workers/worker');

const moduleExports = require('./index');
const _global = typeof window === 'undefined' ? global : window;
// @ts-ignore
_global.loaders = _global.loaders || {};
// @ts-ignore
module.exports = Object.assign(_global.loaders, moduleExports);
