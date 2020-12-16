import {global} from '@loaders.gl/loader-utils';
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const version = typeof __VERSION__ !== 'undefined' ? __VERSION__ : '';

// @ts-ignore
global.loaders = Object.assign(global.loaders || {}, {
  VERSION: version
});

// @ts-ignore
export default global.loaders;
