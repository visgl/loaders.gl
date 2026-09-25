// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import type {DataSourceOptions} from '../../../src';
import {DataSource, getSourceLoaderOptions, createQueryParameterCredential} from '../../../src';
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
