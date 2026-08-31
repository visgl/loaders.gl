// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import {TileSourceAdapter} from '../../../src/lib/sources/tile-source-adapter';
import {getFetchFunction, mergeImageSourceLoaderProps} from '../../../src/lib/sources/utils/utils';

afterEach(() => vi.unstubAllGlobals());

test('source fetch utilities cover direct, static, and default fetch configuration', async () => {
  const globalFetch = vi.fn(async () => new Response('global'));
  vi.stubGlobal('fetch', globalFetch);

  const directFetch = vi.fn(async () => new Response('direct'));
  await getFetchFunction({fetch: directFetch})('direct-url', {method: 'POST'});
  expect(directFetch).toHaveBeenCalledWith('direct-url', {method: 'POST'});

  await getFetchFunction({
    fetch: {headers: {'X-Static': 'static', 'X-Override': 'old'}, method: 'POST'}
  })('static-url', {headers: {'X-Request': 'request', 'X-Override': 'new'}});
  const [, staticOptions] = globalFetch.mock.calls[0];
  expect(new Headers(staticOptions?.headers).get('X-Static')).toBe('static');
  expect(new Headers(staticOptions?.headers).get('X-Request')).toBe('request');
  expect(new Headers(staticOptions?.headers).get('X-Override')).toBe('new');

  await getFetchFunction()('default-url');
  expect(globalFetch).toHaveBeenLastCalledWith('default-url', undefined);

  const merged = mergeImageSourceLoaderProps({loadOptions: {fetch: directFetch}, marker: true});
  expect(merged.marker).toBe(true);
  await merged.loadOptions.fetch('merged-url');
  expect(directFetch).toHaveBeenLastCalledWith('merged-url', undefined);
});

test('TileSourceAdapter forwards metadata and converts tile requests to image requests', async () => {
  const metadata = {name: 'image source'};
  const getImage = vi.fn(async parameters => parameters);
  const adapter = new TileSourceAdapter({
    getMetadata: async () => metadata,
    getImage
  } as any);

  await expect(adapter.getMetadata()).resolves.toBe(metadata);
  const tile = await adapter.getTile({x: 0, y: 0, z: 1});
  expect(tile).toMatchObject({width: 512, height: 512, layers: []});
  await adapter.getTileData({index: {x: 1, y: 1, z: 2}} as any);
  expect(getImage).toHaveBeenCalledTimes(2);
  expect(adapter.getTileLowerLeftCorner(0, 0, 0)).toHaveLength(2);
  expect(() => adapter.getTile({x: 0, y: 0, z: 0, crs: 'EPSG:4326'})).toThrow(/SRS not ESPG3758/);
});
