// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {ZstdCompression} from '../src/lib/zstd-compression';

test('Zstd forwards initialization rejection when an injected codec exposes a promise', async () => {
  const initializationError = new Error('Zstd initialization failed');
  const originalModules = globalThis.loaders?.modules;
  try {
    const compression = new ZstdCompression({
      modules: {'zstd-codec': {run: () => Promise.reject(initializationError)}}
    });
    await expect(compression.preload()).rejects.toBe(initializationError);
    await expect(compression.preload()).rejects.toBe(initializationError);
  } finally {
    if (globalThis.loaders) {
      globalThis.loaders.modules = originalModules;
    }
  }
});
