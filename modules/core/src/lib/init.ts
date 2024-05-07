// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {log} from '@loaders.gl/loader-utils';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const version = typeof __VERSION__ !== 'undefined' ? __VERSION__ : '';

// @ts-ignore
if (!globalThis.loaders) {
  log.log(1, `loaders.gl ${version}`)();

  // @ts-ignore TS2339: Property 'loaders' does not exist on type 'Window & typeof globalThis'.
  globalThis.loaders = Object.assign(globalThis.loaders || {}, {
    VERSION: version,
    log
  });
}
// @ts-ignore
export default globalThis.loaders;
