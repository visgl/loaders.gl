// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Log} from '@probe.gl/log';

// Version constant cannot be imported, it needs to correspond to the build version of **this** module.
// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
export const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const version = VERSION[0] >= '0' && VERSION[0] <= '9' ? `v${VERSION}` : '';

// Make sure we set the global variable
function createLog() {
  const log = new Log({id: 'loaders.gl'});

  globalThis.loaders = globalThis.loaders || {};
  globalThis.loaders.log = log;
  globalThis.loaders.version = version;

  globalThis.probe = globalThis.probe || {};
  globalThis.probe.loaders = log;

  return log;
}

export const log = createLog();
