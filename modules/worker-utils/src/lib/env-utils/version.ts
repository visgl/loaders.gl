// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Version constant cannot be imported, it needs to correspond to the build version of **this** module.

/**
 * TODO - unpkg.com doesn't seem to have a `latest` specifier for alpha releases...
 * 'beta' on beta branch, 'latest' on prod branch
 */
export const NPM_TAG = 'latest';

declare let __VERSION__: string;

function getVersion() {
  if (!globalThis._loadersgl_?.version) {
    globalThis._loadersgl_ = globalThis._loadersgl_ || {};
    // __VERSION__ is injected by babel-plugin-version-inline
    if (typeof __VERSION__ === 'undefined') {
      // eslint-disable-next-line
      console.warn(
        'loaders.gl: The __VERSION__ variable is not injected using babel plugin. Latest unstable workers would be fetched from the CDN.'
      );
      globalThis._loadersgl_.version = NPM_TAG;
    } else {
      globalThis._loadersgl_.version = __VERSION__;
    }
  }

  return globalThis._loadersgl_.version;
}

export const VERSION = getVersion();
