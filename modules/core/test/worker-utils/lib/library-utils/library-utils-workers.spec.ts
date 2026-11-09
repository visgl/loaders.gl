// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import {
  getLibraryCacheKey,
  loadLibraryInWorker
} from '../../../../src/worker-utils/lib/library-utils/library-utils';
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test('worker cache distinguishes ESM overrides sharing a classic asset', () => {
  const firstKey = getLibraryCacheKey('/same-library.js', '/first-library.mjs', true);
  const secondKey = getLibraryCacheKey('/same-library.js', '/second-library.mjs', true);
  expect(firstKey).not.toBe(secondKey);
  expect(getLibraryCacheKey('/same-library.js', '/first-library.mjs', true)).toBe(firstKey);
  expect(getLibraryCacheKey('/other-library.js', '/first-library.mjs', true)).not.toBe(firstKey);
  expect(getLibraryCacheKey('/same-library.js', '/first-library.mjs', false)).toBe(
    '/same-library.js'
  );
});

test('classic workers import codec scripts after the support probe', async () => {
  const importer = vi.fn();
  vi.stubGlobal('importScripts', importer);
  await loadLibraryInWorker('/classic-library-test.js');
  expect(importer.mock.calls).toEqual([[], ['/classic-library-test.js']]);
});

test('module workers import explicit exports without fetching or installing globals', async () => {
  vi.stubGlobal('importScripts', () => {
    throw new TypeError('Module worker');
  });
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  const source = 'const libraryTestResult = "loaded"; export default libraryTestResult;';
  const moduleUrl = `data:text/javascript,${encodeURIComponent(source)}`;
  await expect(loadLibraryInWorker('/unused-classic-library.js', moduleUrl)).resolves.toBe(
    'loaded'
  );
  expect(fetcher).not.toHaveBeenCalled();
  expect('libraryTestResult' in globalThis).toBe(false);
});

test('module worker import failures propagate without evaluating source', async () => {
  vi.stubGlobal('importScripts', () => {
    throw new TypeError('Module worker');
  });
  const moduleUrl = `data:text/javascript,${encodeURIComponent('throw new Error("Broken module");')}`;
  await expect(loadLibraryInWorker('/unused-classic-library.js', moduleUrl)).rejects.toThrow(
    'Broken module'
  );
});

test('module workers preserve named exports when there is no default', async () => {
  vi.stubGlobal('importScripts', () => {
    throw new TypeError('Module worker');
  });
  const moduleUrl = `data:text/javascript,${encodeURIComponent('export const factory = 42;')}`;
  await expect(loadLibraryInWorker(moduleUrl)).resolves.toMatchObject({factory: 42});
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
