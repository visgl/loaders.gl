/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {
  normalizeOptions,
  applySearchParamsToUrl
} from '@loaders.gl/core/lib/loader-utils/option-utils';

import {GLTFLoader} from '@loaders.gl/gltf';
import {LASLoader} from '@loaders.gl/las';

const TEST_URL = 'http://test.com';

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
    options: {las: {skip: 10}, worker: false},
    assert: (t, options) => {
      t.equal(options.las.skip, 10);
      t.equal(options.worker, false);
    }
  }
];

test('normalizeOptions#normalizeOptions', t => {
  for (const tc of TEST_CASES) {
    const options = normalizeOptions(tc.options, tc.loader);
    tc.assert(t, options);
  }
  t.end();
});

test('applySearchParamsToUrl#Should not apply search params if no options', t => {
  const url = applySearchParamsToUrl(TEST_URL, {});
  t.ok(url);
  t.equal(url, TEST_URL);
  t.end();
});

test('applySearchParamsToUrl#Should not apply search params if no search params in options', t => {
  const url = applySearchParamsToUrl(TEST_URL, {searchParams: null});
  t.ok(url);
  t.equal(url, TEST_URL);
  t.end();
});

test('applySearchParamsToUrl#Should not apply search params if search params is not an object', t => {
  const url = applySearchParamsToUrl(TEST_URL, {searchParams: 'test'});
  t.ok(url);
  t.equal(url, TEST_URL);
  t.end();
});

test('applySearchParamsToUrl#Should apply search params', t => {
  const url = applySearchParamsToUrl(TEST_URL, {
    // eslint-disable-next-line camelcase
    searchParams: {token: '12345', access_token: '54321'}
  });
  t.ok(url);
  t.equal(url, 'http://test.com/?token=12345&access_token=54321');
  t.end();
});

test('applySearchParamsToUrl#Should replace already exited params', t => {
  const URL_WITH_SEARCH_PARAM = 'http://test.com/?token=1000&access_token=2000';
  const url = applySearchParamsToUrl(URL_WITH_SEARCH_PARAM, {
    // eslint-disable-next-line camelcase
    searchParams: {token: '12345', access_token: '54321'}
  });
  t.ok(url);
  t.equal(url, 'http://test.com/?token=12345&access_token=54321');
  t.end();
});
