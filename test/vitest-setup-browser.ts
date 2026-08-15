// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {setupBrowserFileFetch} from './vitest-setup-browser-file-fetch';
import {setupTestEnvironment} from './vitest-setup-common';
import {setupLoaderTestEnvironment} from './vitest-setup-loaders';

if (typeof process === 'undefined') {
  Object.defineProperty(globalThis, 'process', {
    configurable: true,
    enumerable: false,
    writable: true,
    value: {
      browser: true,
      env: {},
      nextTick: (
        callback: (...callbackArguments: unknown[]) => void,
        ...callbackArguments: unknown[]
      ) => {
        queueMicrotask(() => callback(...callbackArguments));
      }
    }
  });
}

setupTestEnvironment({blockExternalNetwork: true});
setupLoaderTestEnvironment();
setupBrowserFileFetch();
