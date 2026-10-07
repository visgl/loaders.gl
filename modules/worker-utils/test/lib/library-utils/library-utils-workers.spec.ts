// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import {loadLibraryInWorker} from '../../../src/lib/library-utils/library-utils';
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test('classic workers import codec scripts after the support probe', async () => {
  const importer = vi.fn();
  vi.stubGlobal('importScripts', importer);
  await loadLibraryInWorker('/classic-library-test.js');
  expect(importer.mock.calls).toEqual([[], ['/classic-library-test.js']]);
});

test('module workers fetch and evaluate library wrappers in global scope', async () => {
  vi.stubGlobal('importScripts', () => {
    throw new TypeError('Module worker');
  });
  vi.stubGlobal('libraryTestResult', undefined);
  const fetcher = vi.fn(async () => new Response("globalThis.libraryTestResult = 'loaded';"));
  vi.stubGlobal('fetch', fetcher);
  await loadLibraryInWorker('/module-library-test.js');
  expect(fetcher).toHaveBeenCalledExactlyOnceWith('/module-library-test.js');
  expect((globalThis as typeof globalThis & {libraryTestResult?: string}).libraryTestResult).toBe(
    'loaded'
  );
});

test('classic worker script failures propagate without an evaluation fallback', async () => {
  const failure = new DOMException('Blocked script', 'SecurityError');
  vi.stubGlobal('importScripts', (...libraries: string[]) => {
    if (libraries.length) throw failure;
  });
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  await expect(loadLibraryInWorker('/blocked-library-test.js')).rejects.toBe(failure);
  expect(fetcher).not.toHaveBeenCalled();
});
