// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import {
  extractLoadLibraryOptions,
  getLibraryUrl,
  loadLibrary
} from '../../../src/lib/library-utils/library-utils';

afterEach(() => {
  delete (globalThis as any).loaders;
  vi.restoreAllMocks();
});

test('library options preserve explicit overrides and reject unnormalized core options', () => {
  expect(
    extractLoadLibraryOptions({
      useLocalLibraries: false,
      CDN: null,
      core: {useLocalLibraries: true, CDN: 'https://fallback.example.com'}
    })
  ).toEqual({useLocalLibraries: false, CDN: null});
  expect(extractLoadLibraryOptions({CDN: 42 as never, core: {CDN: 17 as never}})).toEqual({});
  expect(() => getLibraryUrl('decoder.js', 'test', {core: {} as never} as never)).toThrow(
    'must be pre-normalized'
  );
  expect(getLibraryUrl('decoder.js', 'test')).toBe('modules/test/dist/libs/decoder.js');
});

test('loadLibrary caches Node modules and falls back from dist to source paths', async () => {
  const requireFromFile = vi.fn(async (url: string) => {
    if (url.includes('/dist/libs/')) return undefined;
    return {url};
  });
  (globalThis as any).loaders = {requireFromFile};

  const first = await loadLibrary('decoder-coverage.js', 'test');
  const second = await loadLibrary('decoder-coverage.js', 'test');

  expect(first).toEqual({url: 'modules/test/src/libs/decoder-coverage.js'});
  expect(second).toBe(first);
  expect(requireFromFile).toHaveBeenCalledTimes(2);
});

test('loadLibrary retries local binary paths and reports non-library failures', async () => {
  const readFileAsArrayBuffer = vi.fn(async (url: string) => {
    if (url.includes('/dist/libs/')) throw new Error('missing dist');
    if (url === 'missing-coverage.wasm') throw new Error('missing file');
    return new Uint8Array([1, 2, 3]).buffer;
  });
  (globalThis as any).loaders = {readFileAsArrayBuffer};

  await expect(loadLibrary('decoder-coverage.wasm', 'test')).resolves.toEqual(
    new Uint8Array([1, 2, 3]).buffer
  );
  await expect(loadLibrary('missing-coverage.wasm')).rejects.toThrow(
    'Failed to load ArrayBuffer from missing-coverage.wasm'
  );
});

test('loadLibrary converts thrown Node module loads to null after fallback failure', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  (globalThis as any).loaders = {
    requireFromFile: vi.fn(async () => {
      throw new Error('cannot require');
    })
  };

  await expect(loadLibrary('broken-coverage.js', 'test')).resolves.toBeNull();
  expect(consoleError).toHaveBeenCalledOnce();
});
