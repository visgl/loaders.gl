// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {OGCAPITilesSourceLoader} from '@loaders.gl/wms';
import type {OGCTileMatrixLimits, OGCTileMatrixSet} from '@loaders.gl/wms';

const API_URL = 'https://example.com/api';
const TILESET_URL = `${API_URL}/tiles/regional`;
const MATRIX_SET: OGCTileMatrixSet = {
  crs: 'EPSG:3857',
  tileMatrices: [
    {id: 'coarse', matrixWidth: 4, matrixHeight: 3},
    {id: 'detail', matrixWidth: 8, matrixHeight: 6}
  ]
};
const LIMITS: OGCTileMatrixLimits[] = [
  {tileMatrix: 'coarse', minTileCol: 1, maxTileCol: 2, minTileRow: 1, maxTileRow: 2}
];

/** Makes a deterministic OGC source whose matrix geometry is intentionally incomplete. */
function createSource(limits: unknown = LIMITS) {
  const requestedUrls: string[] = [];
  const tileset: {tileMatrixSetId: string; tileMatrixSetLimits?: unknown} = {
    tileMatrixSetId: 'regional',
    tileMatrixSetLimits: limits
  };
  const source = OGCAPITilesSourceLoader.createDataSource(API_URL, {
    'ogc-api': {tileTemplate: `${TILESET_URL}/{tileMatrix}/{tileRow}/{tileCol}`}
  });
  const fetch: typeof source.fetch = async url => {
    requestedUrls.push(url);
    if (url === API_URL) return Response.json({title: 'Regional'});
    if (url === TILESET_URL) return Response.json(tileset);
    if (url === `${API_URL}/tileMatrixSets/regional`) return Response.json(MATRIX_SET);
    if (url.startsWith(`${TILESET_URL}/`)) return new Response(new Uint8Array([1, 2]));
    throw new Error(`Unexpected request: ${url}`);
  };
  source.fetch = fetch;
  return {source, tileset, requestedUrls, fetch};
}

test('discovered limits are exposed and enforced without requiring complete geometry', async () => {
  const {source, requestedUrls} = createSource();
  expect(() => source.isTileAvailable({z: 0, x: 1, y: 1})).toThrow('has not loaded');
  const metadata = await source.getMetadata();
  expect(metadata.tileGrid?.tileMatrixSet).toBeUndefined();
  expect(metadata.tileGrid?.limits).toEqual([
    {tileMatrix: 'coarse', minTileColumn: 1, maxTileColumn: 2, minTileRow: 1, maxTileRow: 2}
  ]);
  expect(source.isTileAvailable({z: 0, x: 1, y: 1})).toBe(true);
  expect(source.isTileAvailable({z: 0, x: 2, y: 2})).toBe(true);
  expect(source.isTileAvailable({z: 1, tileMatrix: 'coarse', x: 2, y: 2})).toBe(true);
  requestedUrls.length = 0;
  for (const parameters of [
    {z: 0, x: 0, y: 1},
    {z: 0, x: 1, y: 3},
    {z: 1, x: 1, y: 1}
  ]) {
    expect(source.isTileAvailable(parameters)).toBe(false);
    expect(() => source.getTileURL(parameters)).toThrow('outside advertised coverage');
    expect(await source.getTile(parameters)).toBeNull();
  }
  expect(requestedUrls).toEqual([]);
  expect(new Uint8Array((await source.getTile({z: 0, x: 1, y: 1}))!)).toEqual(
    new Uint8Array([1, 2])
  );
  expect(requestedUrls).toEqual([`${TILESET_URL}/coarse/1/1`]);
});

test('absent limits allow the matrix while an empty list allows no tiles', async () => {
  const absent = createSource();
  delete absent.tileset.tileMatrixSetLimits;
  await absent.source.getMetadata();
  expect(absent.source.isTileAvailable({z: 0, x: 0, y: 0})).toBe(true);
  expect(absent.source.isTileAvailable({z: 0, x: 4, y: 0})).toBe(false);
  expect(absent.source.isTileAvailable({z: 2, x: 0, y: 0})).toBe(false);
  expect(() => absent.source.isTileAvailable({z: 0, x: 0, y: 0, tileMatrix: 'missing'})).toThrow(
    'Unknown tile matrix'
  );
  const empty = createSource([]);
  expect(await empty.source.getTile({z: 0, x: 0, y: 0})).toBeNull();
  expect(empty.requestedUrls).toEqual([TILESET_URL, `${API_URL}/tileMatrixSets/regional`]);
});

test.each(
  [
    null,
    {},
    [null],
    [{...LIMITS[0], minTileCol: -1}],
    [{...LIMITS[0], maxTileRow: 1.5}],
    [{...LIMITS[0], minTileRow: 2, maxTileRow: 1}],
    [{...LIMITS[0], maxTileCol: 4}],
    [{...LIMITS[0], tileMatrix: 'missing'}],
    [LIMITS[0], LIMITS[0]]
  ].map(limits => ({limits}))
)('rejects malformed advertised limits and retries: $limits', async ({limits}) => {
  const {source, tileset} = createSource(limits);
  await expect(source.getMetadata()).rejects.toThrow(/limits/);
  tileset.tileMatrixSetLimits = LIMITS;
  await expect(source.getTile({z: 0, x: 1, y: 1})).resolves.toBeInstanceOf(ArrayBuffer);
});

test('configured limits replace discovered limits and are invalidated with options', async () => {
  const {source, fetch} = createSource();
  await source.getMetadata();
  source.setProps({'ogc-api': {tileMatrixSet: MATRIX_SET, tileMatrixSetLimits: []}});
  source.fetch = fetch;
  expect(await source.getTile({z: 0, x: 1, y: 1})).toBeNull();
  source.setProps({'ogc-api': {tileMatrixSetLimits: LIMITS}});
  source.fetch = fetch;
  expect(source.isTileAvailable({z: 0, x: 1, y: 1})).toBe(true);
  expect(await source.getTile({z: 0, x: 1, y: 1})).toBeInstanceOf(ArrayBuffer);
});

test.each([
  -1,
  0.5,
  NaN,
  Infinity,
  Number.MAX_SAFE_INTEGER + 1
])('rejects invalid tile indices %s', async value => {
  const {source} = createSource();
  await source.getMetadata();
  expect(() => source.isTileAvailable({z: 0, x: value, y: 1})).toThrow('safe integers');
  expect(() => source.isTileAvailable({z: 0, x: 1, y: value})).toThrow('safe integers');
  expect(() => source.isTileAvailable({z: value, x: 1, y: 1})).toThrow('safe integers');
});

test('coverage changes invalidate discovery and undefined restores advertised limits', async () => {
  const {source, fetch} = createSource();
  source.setProps({'ogc-api': {tileMatrixSetLimits: []}});
  source.fetch = fetch;
  expect(await source.getTile({z: 0, x: 1, y: 1})).toBeNull();
  source.setProps({'ogc-api': {tileMatrixSetLimits: undefined}});
  source.fetch = fetch;
  expect(await source.getTile({z: 0, x: 1, y: 1})).toBeInstanceOf(ArrayBuffer);
});

test('configured coverage works without geometry when discovery is disabled', async () => {
  const {source, fetch} = createSource();
  source.setProps({'ogc-api': {discoverTileMatrixSet: false, tileMatrixSetLimits: LIMITS}});
  source.fetch = fetch;
  expect(source.isTileAvailable({z: 0, tileMatrix: 'coarse', x: 1, y: 1})).toBe(true);
  expect(await source.getTile({z: 0, tileMatrix: 'coarse', x: 0, y: 1})).toBeNull();
});

test('availability rejects invalid advertised dimensions without requiring geometry', () => {
  const source = OGCAPITilesSourceLoader.createDataSource(API_URL, {
    'ogc-api': {
      tileTemplate: `${TILESET_URL}/{tileMatrix}/{tileRow}/{tileCol}`,
      tileMatrixSet: {
        crs: 'EPSG:3857',
        tileMatrices: [{id: 'coarse', matrixWidth: 0, matrixHeight: 3}]
      }
    }
  });
  expect(() => source.isTileAvailable({z: 0, x: 0, y: 0})).toThrow('positive safe integers');
});

test.each([
  {matrixWidth: 4},
  {matrixHeight: 3}
])('rejects incomplete matrix dimensions before requesting tile content: %j', async dimensions => {
  const source = OGCAPITilesSourceLoader.createDataSource(API_URL, {
    'ogc-api': {
      tileTemplate: `${TILESET_URL}/{tileMatrix}/{tileRow}/{tileCol}`,
      tileMatrixSet: {tileMatrices: [{id: 'coarse', ...dimensions}]}
    }
  });
  const requestedUrls: string[] = [];
  source.fetch = async url => {
    requestedUrls.push(url);
    throw new Error('Unexpected tile request');
  };
  expect(() => source.isTileAvailable({z: 0, x: 99, y: 99})).toThrow(
    'require both matrixWidth and matrixHeight'
  );
  await expect(source.getTile({z: 0, x: 99, y: 99})).rejects.toThrow(
    'require both matrixWidth and matrixHeight'
  );
  expect(requestedUrls).toEqual([]);
});
