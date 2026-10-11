// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import {loadLibrary} from '../../../src/lib/library-utils/library-utils';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.getElementById('/cleanup-library-test.js')?.remove();
});

test('main-thread library loading installs a script once without eval', async () => {
  vi.stubGlobal('cleanupLibraryResult', undefined);
  const evaluator = vi.spyOn(globalThis, 'eval');
  const fetcher = vi.fn(async () => new Response('globalThis.cleanupLibraryResult = 42;'));
  vi.stubGlobal('fetch', fetcher);
  await loadLibrary('/cleanup-library-test.js');
  await loadLibrary('/cleanup-library-test.js');
  expect(
    (globalThis as typeof globalThis & {cleanupLibraryResult?: number}).cleanupLibraryResult
  ).toBe(42);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(evaluator).not.toHaveBeenCalled();
});
