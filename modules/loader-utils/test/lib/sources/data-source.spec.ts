import {expect, test} from 'vitest';
import type {DataSourceOptions} from '../../../src';
import {DataSource} from '../../../src';
class TestDataSource extends DataSource<string, DataSourceOptions> {}
test('DataSource#normalizes legacy loadOptions base URL aliases', () => {
  const source = new TestDataSource('https://example.com/data', {
    core: {
      loadOptions: {
        baseUri: 'https://example.com/model.gltf'
      }
    }
  });
  expect(
    source.loadOptions.core?.baseUrl,
    'top-level baseUri is normalized to core.baseUrl for direct parser calls'
  ).toBe('https://example.com/model.gltf');
  expect(source.loadOptions.baseUri, 'deprecated baseUri alias is removed').toBe(undefined);
  const sourceWithBaseUrl = new TestDataSource('https://example.com/data', {
    core: {
      loadOptions: {
        baseUrl: 'https://example.com/textures'
      }
    }
  });
  expect(
    sourceWithBaseUrl.loadOptions.core?.baseUrl,
    'top-level baseUrl is normalized to core.baseUrl for direct parser calls'
  ).toBe('https://example.com/textures');
  expect(sourceWithBaseUrl.loadOptions.baseUrl, 'top-level baseUrl alias is removed').toBe(
    undefined
  );
});
