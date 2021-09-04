import * as moduleExports from './index';
// @ts-ignore
globalThis.loaders = globalThis.loaders || {};
// @ts-ignore
module.exports = Object.assign(globalThis.loaders, moduleExports);
