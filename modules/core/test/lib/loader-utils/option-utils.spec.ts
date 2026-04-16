import {expect, test} from 'vitest';
import {
  getGlobalLoaderOptions,
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
