// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import type {DataSourceOptions} from '../../../../src/loader-utils';
import {
  DataSource,
  getSourceLoaderOptions,
  createQueryParameterCredential
} from '../../../../src/loader-utils';
/** Minimal source used to exercise shared options without loading resources. */
class TestDataSource extends DataSource<string, DataSourceOptions> {}
test('DataSource normalizes legacy base URL aliases for direct parser calls', () => {
  const source = new TestDataSource('https://example.com/data', {
    baseUri: 'https://example.com/model.gltf'
  } as unknown as DataSourceOptions);
  expect(
    source.loadOptions.core?.baseUrl,
    'top-level baseUri is normalized to core.baseUrl for direct parser calls'
  ).toBe('https://example.com/model.gltf');
  expect(source.loadOptions.baseUri, 'deprecated baseUri alias is removed').toBe(undefined);
  const sourceWithBaseUrl = new TestDataSource('https://example.com/data', {
    core: {baseUrl: 'https://example.com/textures'}
  });
  expect(
    sourceWithBaseUrl.loadOptions.core?.baseUrl,
    'top-level baseUrl is normalized to core.baseUrl for direct parser calls'
  ).toBe('https://example.com/textures');
  expect(sourceWithBaseUrl.loadOptions.baseUrl, 'top-level baseUrl alias is removed').toBe(
    undefined
  );
});

test('DataSource shares flat parser and fetch options without forwarding source controls', async () => {
  const fetchResource = vi.fn(async (_url: string, _options?: RequestInit) => new Response('ok'));
  const onError = vi.fn();
  const credentials = [
    createQueryParameterCredential({
      id: 'source',
      origins: ['http://localhost'],
      parameterName: 'token',
      token: 'test'
    })
  ];
  const options: DataSourceOptions = {
    core: {
      fetch: fetchResource,
      worker: false,
      type: 'test',
      attributions: ['author'],
      loaders: [],
      onError,
      credentials
    },
    mvt: {layerProperty: 'layer'},
    mlt: {layers: ['roads']}
  };
  const source = new TestDataSource('https://example.com/data', options);
  // The custom fetch above is a mock; no request leaves this test.
  const tileURL = 'http://localhost/tile';
  await source.fetch(tileURL);
  expect(fetchResource.mock.calls[0][0]).toBe('http://localhost/tile?token=test');
  expect(source.loadOptions).toEqual({
    core: {fetch: fetchResource, worker: false, credentials},
    mvt: {layerProperty: 'layer'},
    mlt: {layers: ['roads']}
  });
  expect(source.options.core.onError).toBe(onError);
  expect(options.core?.loaders).toEqual([]);
  expect(options.core?.type).toBe('test');
});

test('DataSource merges namespace defaults and refreshes parser and fetch options on setProps', async () => {
  const originalFetch = vi.fn(async () => new Response('original'));
  const updatedFetch = vi.fn(async () => new Response('updated'));
  const source = new TestDataSource(
    'memory://data',
    {
      core: {fetch: originalFetch, worker: false},
      mvt: {shape: 'binary-geometry'}
    },
    {mvt: {shape: 'arrow-table', layers: ['roads']}}
  );
  expect(source.options.core.type).toBe('auto');
  expect(source.loadOptions.mvt).toEqual({shape: 'binary-geometry', layers: ['roads']});
  source.setProps({core: {fetch: updatedFetch}, mvt: {layerProperty: 'name'}});
  await source.fetch('memory://tile');
  expect(originalFetch).not.toHaveBeenCalled();
  expect(updatedFetch).toHaveBeenCalledOnce();
  expect(source.loadOptions.core?.worker).toBe(false);
  expect(source.loadOptions.mvt).toEqual({
    shape: 'binary-geometry',
    layers: ['roads'],
    layerProperty: 'name'
  });
});

test.each([
  {core: {loadOptions: {core: {worker: false}}}},
  {loadOptions: {mvt: {layers: ['roads']}}}
])('DataSource rejects removed option wrappers with migration guidance', options => {
  expect(() => getSourceLoaderOptions(options as unknown as DataSourceOptions)).toThrow(
    'Use core and root loader namespaces directly'
  );
});

test('source names use explicit names, available metadata, filenames and type fallbacks without fetching', () => {
  class NamedDataSource extends DataSource<unknown, DataSourceOptions> {}
  const fetch = vi.fn();
  const source = new NamedDataSource(
    'https://example.com/path/cities.parquet?token=secret#fragment',
    {core: {name: 'warehouse', fetch}}
  );
  expect(source.name).toBe('warehouse');
  expect(source.loadOptions.core).not.toHaveProperty('name');
  expect(
    new NamedDataSource('https://example.com/path/cities%20east.parquet?token=secret', {}).name
  ).toBe('cities east');
  expect(new NamedDataSource(new File([''], 'cities.csv'), {}).name).toBe('cities');
  expect(new NamedDataSource({name: 'cities.v2'}, {}).name).toBe('cities.v2');
  expect(new NamedDataSource({schema: {metadata: {name: 'embedded.table'}}}, {}).name).toBe(
    'embedded.table'
  );
  expect(
    new NamedDataSource({schema: {metadata: new Map([['name', 'arrowTable']])}}, {}).name
  ).toBe('arrowTable');
  expect(new NamedDataSource('https://example.com/', {core: {type: 'catalog'}}).name).toBe(
    'catalog'
  );
  expect(new NamedDataSource(new Blob([]), {}).name).toBe('source');
  expect(new NamedDataSource('data:text/plain,rows', {}).name).toBe('source');
  expect(new NamedDataSource('blob:https://example.com/id', {}).name).toBe('source');
  expect(new NamedDataSource('https://example.com/.hidden', {}).name).toBe('.hidden');
  expect(new NamedDataSource('https://example.com/%ZZ.csv', {}).name).toBe('%ZZ');
  expect(new NamedDataSource('https://[invalid', {}).name).toBe('source');
  expect(fetch).not.toHaveBeenCalled();
  expect(() => source.setProps({core: {name: 'renamed'}})).toThrow('fixed at creation');
  source.setProps({core: {name: 'warehouse'}});
  expect(source.name).toBe('warehouse');
});

test.each(['', '   ', 3])('invalid explicit source name fails: %j', name => {
  expect(
    () => new TestDataSource('cities.csv', {core: {name}} as unknown as DataSourceOptions)
  ).toThrow('non-empty string');
});
