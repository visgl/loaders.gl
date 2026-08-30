// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  getGlobalLoaderState,
  getGlobalLoaderOptions,
  normalizeLoaderOptions,
  normalizeOptions,
  setGlobalOptions
} from '@loaders.gl/core/lib/loader-utils/option-utils';
import {GLTFLoader} from '@loaders.gl/gltf';
import {LASLoader} from '@loaders.gl/las';
import {ArrowLoader} from '@loaders.gl/arrow';
const TEST_CASES = [
  {
    loader: GLTFLoader,
    options: {gltf: {compress: false}},
    assert: options => {
      expect(options.gltf.compress).toBe(false);
    }
  },
  {
    loader: LASLoader,
    options: {las: {skip: 10}, core: {worker: false}},
    assert: options => {
      expect(options.las.skip).toBe(10);
      expect(options.core.worker).toBe(false);
      expect(options.worker).toBe(undefined);
    }
  },
  {
    loader: LASLoader,
    options: {las: {skip: 2}, worker: false},
    assert: options => {
      expect(options.las.skip).toBe(2);
      expect(options.core.worker).toBe(false);
      expect(options.worker).toBe(undefined);
    }
  },
  {
    loader: LASLoader,
    options: {las: {skip: 5}, core: {worker: true}, worker: false},
    assert: options => {
      expect(options.core.worker).toBe(true);
      expect(options.worker).toBe(undefined);
    }
  },
  {
    loader: ArrowLoader,
    options: {shape: 'object-row-table'},
    assert: options => {
      expect(options.core.shape).toBe('object-row-table');
      expect(options.arrow.shape).toBe('object-row-table');
      expect(options.shape).toBe(undefined);
    }
  },
  {
    loader: ArrowLoader,
    options: {core: {shape: 'object-row-table'}},
    assert: options => {
      expect(options.core.shape).toBe('object-row-table');
      expect(options.arrow.shape).toBe('object-row-table');
    }
  },
  {
    loader: ArrowLoader,
    options: {core: {shape: 'object-row-table'}, arrow: {shape: 'array-row-table'}},
    assert: options => {
      expect(options.core.shape).toBe('object-row-table');
      expect(options.arrow.shape).toBe('array-row-table');
    }
  },
  {
    loader: LASLoader,
    options: {fetch: () => Promise.resolve(null)},
    assert: options => {
      expect(typeof options.core.fetch).toBe('function');
      expect(options.fetch).toBe(undefined);
    }
  },
  {
    loader: LASLoader,
    options: {},
    url: 'https://example.com/tileset.las',
    assert: (options, url) => {
      expect(options.core.baseUrl).toBe('https://example.com');
      expect(options.baseUri).toBe(undefined);
    }
  }
];
test('normalizeOptions#normalizeOptions', () => {
  for (const testCase of TEST_CASES) {
    const options = normalizeOptions(testCase.options, testCase.loader, undefined, testCase.url);
    testCase.assert(options, testCase.url);
  }
});
test('normalizeOptions#movesGlobalCoreOptions', () => {
  const originalGlobalOptions = getGlobalLoaderOptions();
  const originalClone = {...originalGlobalOptions, core: {...originalGlobalOptions.core}};
  setGlobalOptions({worker: false});
  const normalized = normalizeOptions({}, LASLoader, undefined, undefined);
  expect(normalized.core.worker, 'global worker option is present under core').toBe(false);
  expect(
    (normalized as any).worker,
    'deprecated top-level alias is removed after normalization'
  ).toBe(undefined);
  setGlobalOptions(originalClone);
});

test('normalizeLoaderOptions clones nested core options and migrates legacy aliases', () => {
  const input = {
    baseUri: 'legacy/',
    worker: false,
    _worker: 'module',
    core: {baseUrl: 'explicit/', worker: true}
  } as any;
  const normalized = normalizeLoaderOptions(input);

  expect(normalized.core).toMatchObject({
    baseUrl: 'explicit/',
    worker: true,
    _workerType: 'module'
  });
  expect(normalized).not.toHaveProperty('worker');
  expect(normalized).not.toHaveProperty('_worker');
  expect(normalized.core).not.toBe(input.core);
  expect(input.core).toEqual({baseUrl: 'explicit/', worker: true});
});

test('normalizeOptions covers loader validation, null logging, and fixed base URLs', () => {
  const loader = {
    id: 'example',
    name: 'Example',
    module: 'test',
    version: 'latest',
    extensions: ['example'],
    mimeTypes: [],
    options: {
      core: {log: null},
      batchSize: 10,
      example: {shape: 'default', known: true}
    },
    deprecatedOptions: {example: {removed: 'example.known'}}
  } as any;

  const normalized = normalizeOptions(
    {
      core: {baseUrl: 'fixed/'},
      batch: 2,
      unrelated: {allowed: true},
      example: {removed: true, workerUrl: 'worker.js', unknown: true}
    },
    loader,
    loader,
    'https://example.test/path/file.example?query=1'
  );
  expect(normalized.core.baseUrl).toBe('fixed/');
  expect(normalized.core.log?.warn('ignored')).toBeTypeOf('function');
  expect(normalized.example).toMatchObject({shape: 'default', known: true, removed: true});
});

test('normalizeOptions honors global scoped shape and initializes missing global state', () => {
  const globalObject = globalThis as any;
  const originalLoaders = globalObject.loaders;
  try {
    delete globalObject.loaders;
    const state = getGlobalLoaderState();
    expect(state).toEqual({});
    setGlobalOptions({arrow: {shape: 'columnar-table'}});
    expect(normalizeOptions({core: {shape: 'object-row-table'}}, ArrowLoader).arrow.shape).toBe(
      'columnar-table'
    );
  } finally {
    globalObject.loaders = originalLoaders;
  }
});
