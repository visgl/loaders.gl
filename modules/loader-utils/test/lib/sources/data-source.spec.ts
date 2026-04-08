// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import type {DataSourceOptions} from '../../../src';
import {DataSource} from '../../../src';

class TestDataSource extends DataSource<string, DataSourceOptions> {}

test('DataSource#normalizes legacy loadOptions base URL aliases', t => {
  const source = new TestDataSource('https://example.com/data', {
    core: {
      loadOptions: {
        baseUri: 'https://example.com/model.gltf'
      }
    }
  });

  t.equal(
    source.loadOptions.core?.baseUrl,
    'https://example.com/model.gltf',
    'top-level baseUri is normalized to core.baseUrl for direct parser calls'
  );
  t.equal(source.loadOptions.baseUri, undefined, 'deprecated baseUri alias is removed');

  const sourceWithBaseUrl = new TestDataSource('https://example.com/data', {
    core: {
      loadOptions: {
        baseUrl: 'https://example.com/textures'
      }
    }
  });

  t.equal(
    sourceWithBaseUrl.loadOptions.core?.baseUrl,
    'https://example.com/textures',
    'top-level baseUrl is normalized to core.baseUrl for direct parser calls'
  );
  t.equal(sourceWithBaseUrl.loadOptions.baseUrl, undefined, 'top-level baseUrl alias is removed');

  t.end();
});
