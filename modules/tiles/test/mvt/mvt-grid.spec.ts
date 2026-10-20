// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test, vi} from 'vitest';
import {MVTTileSource} from '@loaders.gl/tiles/mvt';
import {parseTileJSON} from '../../src/mvt/lib/parse-tilejson';
import type {CoreAPI} from '@loaders.gl/core/loader-utils';

test.each([
  'xyz',
  'tms'
] as const)('Configured source uses native XYZ matrices and %s wire rows', async scheme => {
  const fetcher = vi.fn(async () => new Response(new Uint8Array([7])));
  const source = new MVTTileSource('https://example.com/{z}/{x}/{y}.mvt', {
    mvt: {
      metadataUrl: null,
      coordinateReferenceSystem: 'EPSG:3857',
      minZoom: 3,
      maxZoom: 4,
      tileSize: 512,
      scheme
    },
    core: {fetch: fetcher}
  });
  const metadata = await source.metadata;
  expect(metadata.tileGrid?.matrixIds).toEqual(['3', '4']);
  expect(metadata.tileGrid?.tileSize).toEqual([512, 512]);
  expect(fetcher).not.toHaveBeenCalled();
  expect(await source.getTile({z: 0, x: 2, y: 1, tileMatrix: '4'})).toBeInstanceOf(ArrayBuffer);
  expect(fetcher.mock.calls[0][0]).toBe(`https://example.com/4/2/${scheme === 'tms' ? 14 : 1}.mvt`);
  expect(await source.getTile({z: 4, x: 16, y: 0})).toBeNull();
  await expect(source.getTile({z: 0, x: 0, y: 0, tileMatrix: 'unknown'})).rejects.toThrow(
    /Unknown/
  );
  expect(fetcher).toHaveBeenCalledTimes(1);
});

test('TileJSON establishes grid and row convention without deriving geometry from dataset bounds', async () => {
  const fetcher = vi.fn(async () =>
    Response.json({
      tilejson: '3.0.0',
      scheme: 'tms',
      minzoom: 2,
      maxzoom: 3,
      bounds: [1, 2, 3, 4],
      tiles: ['https://example.com/{z}/{x}/{y}']
    })
  );
  const source = new MVTTileSource('https://example.com/{z}/{x}/{y}', {core: {fetch: fetcher}}, {
    parse: async (text: string) => parseTileJSON(JSON.parse(text), {})
  } as unknown as CoreAPI);
  const metadata = await source.metadata;
  expect(metadata.tileGrid?.matrixIds).toEqual(['2', '3']);
  expect(metadata.tileGrid?.tileMatrixSet?.matrices[0].matrixSize).toEqual([4, 4]);
  expect(metadata.tileGrid?.limits).toBeUndefined();
  expect(source.getTileURL(1, 0, 2)).toBe('https://example.com/2/1/3');
});

test('An arbitrary standalone template does not establish a geographic grid', async () => {
  const source = new MVTTileSource('https://example.com/{z}/{x}/{y}', {mvt: {metadataUrl: null}});
  expect((await source.metadata).tileGrid).toBeUndefined();
});

test('TMS metadata does not double-invert the legacy {-y} template token', async () => {
  const source = new MVTTileSource('https://example.com/{z}/{x}/{-y}.mvt', {
    mvt: {metadataUrl: null, tileSize: 256, scheme: 'tms'}
  });
  await source.metadata;
  expect(source.getTileURL(1, 0, 2)).toBe('https://example.com/2/1/3.mvt');
});

test('Logical pixel size alone does not invent a CRS for a standalone template', async () => {
  const source = new MVTTileSource('https://example.com/{z}/{x}/{y}', {
    mvt: {metadataUrl: null, tileSize: 512}
  });
  expect((await source.metadata).tileGrid).toBeUndefined();
});

test('Aborting one MVT metadata waiter settles promptly without cancelling another tile request', async () => {
  let finishMetadata!: (response: Response) => void;
  const metadataResponse = new Promise<Response>(resolve => {
    finishMetadata = resolve;
  });
  const fetcher = vi.fn(async input =>
    String(input).endsWith('tilejson.json') ? metadataResponse : new Response(new Uint8Array([7]))
  );
  const source = new MVTTileSource(
    'https://example.com/{z}/{x}/{y}.mvt',
    {
      core: {fetch: fetcher}
    },
    {parse: async (text: string) => parseTileJSON(JSON.parse(text), {})} as unknown as CoreAPI
  );
  const controller = new AbortController();
  const cancelled = source.getTile({z: 3, x: 1, y: 2, signal: controller.signal});
  const surviving = source.getTile({z: 3, x: 1, y: 2});
  const cancellation = expect(cancelled).rejects.toMatchObject({name: 'AbortError'});
  controller.abort();
  await cancellation;
  expect(fetcher).toHaveBeenCalledTimes(1);
  finishMetadata(
    Response.json({
      tilejson: '3.0.0',
      minzoom: 3,
      maxzoom: 3,
      tiles: ['https://example.com/{z}/{x}/{y}.mvt']
    })
  );
  expect(await surviving).toBeInstanceOf(ArrayBuffer);
  expect(fetcher).toHaveBeenCalledTimes(2);
});

test('MVT consumer selects the native zoom for the request and vector decoding', async () => {
  const signal = new AbortController().signal;
  const fetcher = vi.fn(async () => new Response(new Uint8Array(16)));
  const parse = vi.fn(async () => ({shape: 'geojson-table', features: []}));
  const source = new MVTTileSource(
    'https://example.com/{z}/{x}/{y}.mvt',
    {
      mvt: {metadataUrl: null, coordinateReferenceSystem: 'EPSG:3857', minZoom: 0, maxZoom: 3},
      core: {fetch: fetcher}
    },
    {parse} as unknown as CoreAPI
  );
  await source.getTileData({index: {z: 0, x: 2, y: 1}, tileMatrix: '3', signal});
  expect(fetcher).toHaveBeenCalledWith('https://example.com/3/2/1.mvt', {signal});
  expect(parse).toHaveBeenCalledWith(
    expect.any(ArrayBuffer),
    expect.anything(),
    expect.objectContaining({mvt: expect.objectContaining({tileIndex: {z: 3, x: 2, y: 1}})})
  );
});

test.each([
  {minzoom: 0.5, maxzoom: 3},
  {minzoom: 3, maxzoom: 2},
  {minzoom: 0, maxzoom: 32},
  {minzoom: -1, maxzoom: 3}
])('Unrepresentable TileJSON ranges preserve native requests (%j)', async range => {
  const fetcher = vi.fn(async input =>
    String(input).endsWith('tilejson.json')
      ? Response.json({tilejson: '3.0.0', ...range, tiles: ['https://example.com/{z}/{x}/{y}.mvt']})
      : new Response(new Uint8Array(16))
  );
  const source = new MVTTileSource(
    'https://example.com/{z}/{x}/{y}.mvt',
    {core: {fetch: fetcher}},
    {parse: async (text: string) => parseTileJSON(JSON.parse(text), {})} as unknown as CoreAPI
  );
  const metadata = await source.metadata;
  expect(metadata.tileGrid).toBeUndefined();
  expect(metadata.minZoom).toBe(range.minzoom);
  expect(metadata.maxZoom).toBe(range.maxzoom);
  expect(await source.getTile({z: 1, x: 0, y: 0})).toBeInstanceOf(ArrayBuffer);
  expect(fetcher.mock.calls.at(-1)?.[0]).toBe('https://example.com/1/0/0.mvt');
});
