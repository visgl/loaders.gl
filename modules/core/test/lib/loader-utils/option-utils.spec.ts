// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {
  getGlobalLoaderOptions,
  normalizeOptions,
  setGlobalOptions
} from '@loaders.gl/core/lib/loader-utils/option-utils';

import {GLTFLoader} from '@loaders.gl/gltf';
import {LASLoader} from '@loaders.gl/las';

const TEST_CASES = [
  {
    loader: GLTFLoader,
    options: {gltf: {compress: false}},
    assert: (t, options) => {
      t.equal(options.gltf.compress, false);
    }
  },
  {
    loader: LASLoader,
    options: {las: {skip: 10}, core: {worker: false}},
    assert: (t, options) => {
      t.equal(options.las.skip, 10);
      t.equal(options.worker, false);
      t.equal(options.core.worker, false);
    }
  },
  {
    loader: LASLoader,
    options: {las: {skip: 2}, worker: false},
    assert: (t, options) => {
      t.equal(options.las.skip, 2);
      t.equal(options.worker, false);
      t.equal(options.core.worker, false);
    }
  },
  {
    loader: LASLoader,
    options: {las: {skip: 5}, core: {worker: true}, worker: false},
    assert: (t, options) => {
      t.equal(options.worker, true);
      t.equal(options.core.worker, true);
    }
  },
  {
    loader: LASLoader,
    options: {fetch: () => Promise.resolve(null)},
    assert: (t, options) => {
      t.equal(typeof options.fetch, 'function');
      t.equal(options.fetch, options.core.fetch);
    }
  },
  {
    loader: LASLoader,
    options: {},
    url: 'https://example.com/tileset.las',
    assert: (t, options, url) => {
      t.equal(options.baseUri, url);
      t.equal(options.core.baseUri, url);
    }
  }
];

test('normalizeOptions#normalizeOptions', (t) => {
  for (const tc of TEST_CASES) {
    const options = normalizeOptions(tc.options, tc.loader, undefined, tc.url);
    tc.assert(t, options, tc.url);
  }
  t.end();
});

test('normalizeOptions#movesGlobalCoreOptions', (t) => {
  const originalGlobalOptions = getGlobalLoaderOptions();
  const originalClone = {...originalGlobalOptions, core: {...originalGlobalOptions.core}};

  setGlobalOptions({worker: false});
  const normalized = normalizeOptions({}, LASLoader, undefined, undefined);
  t.equal(normalized.core.worker, false, 'global worker option is present under core');
  t.equal(normalized.worker, false, 'deprecated top-level alias is applied after normalization');

  setGlobalOptions(originalClone);
  t.end();
});
