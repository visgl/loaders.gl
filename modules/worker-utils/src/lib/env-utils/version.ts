// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {NPM_TAG} from '../npm-tag';

// Version constant cannot be imported, it needs to correspond to the build version of **this** module.
declare let __VERSION__: string;

/** Get the injected loaders.gl package version, or the npm tag used for unpublished builds. */
function getVersion() {
  if (!globalThis._loadersgl_?.version) {
    globalThis._loadersgl_ = globalThis._loadersgl_ || {};
    // __VERSION__ is injected by babel-plugin-version-inline
    if (typeof __VERSION__ === 'undefined') {
      globalThis._loadersgl_.version = NPM_TAG;
    } else {
      globalThis._loadersgl_.version = __VERSION__;
    }
  }

  return globalThis._loadersgl_.version;
}

export const VERSION = getVersion();
