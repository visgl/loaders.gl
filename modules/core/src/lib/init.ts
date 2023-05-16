// loaders.gl, MIT license
import {log} from './utils/log';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const version = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

// @ts-ignore
if (!globalThis.loaders) {
  log.log(1, `loaders.gl ${version}`)();

  globalThis.loaders = Object.assign(globalThis.loaders || {}, {
    VERSION: version,
    log
  });
}
// @ts-ignore
export default globalThis.loaders;
