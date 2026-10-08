// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {OGCAPISourceOptions, OGCTileMatrixSet} from '@loaders.gl/wms';
import {OGCAPITilesSourceLoader} from '@loaders.gl/wms';
import DATASET_TILESET from './data/ogc-api-tiles/tileset-dataset.json';
import COLLECTION_TILESET from './data/ogc-api-tiles/tileset-collection.json';
import TILE_MATRIX_SETS from './data/ogc-api-tiles/tile-matrix-sets.json';
import WEB_MERCATOR_QUAD from './data/ogc-api-tiles/tile-matrix-set-web-mercator-quad.json';
import WORLD_CRS84_QUAD from './data/ogc-api-tiles/tile-matrix-set-world-crs84-quad.json';

const LANDING_PAGE_URL = 'https://example.com/ogcapi';
const LANDING_PAGE = {title: 'Demo API'};
const DATASET_TEMPLATE = `${LANDING_PAGE_URL}/tiles/WebMercatorQuad/{tileMatrix}/{tileRow}/{tileCol}?f=mvt`;
const COLLECTION_TEMPLATE =
  '/ogcapi/collections/countries/map/tiles/WorldCRS84Quad/{tileMatrix}/{tileRow}/{tileCol}.png';

/** A matrix set whose identifiers differ from zoom numbers. */
const NAMED_LEVELS: OGCTileMatrixSet = {
  id: 'NamedLevels',
  crs: 'http://www.opengis.net/def/crs/EPSG/0/3857',
  tileMatrices: [
    {id: 'L0', cellSize: 2},
    {id: 'L1', cellSize: 1}
  ]
};

/** A JSON body, an `ArrayBuffer`, or `{status}` for an error response. */
type Route = unknown;

/** Creates a source whose fetch answers from `routes` and records each request. */
function createSource(routes: Record<string, Route>, options: OGCAPISourceOptions['ogc-api']) {
  const requestedUrls: string[] = [];
  const errors: Error[] = [];
  const source = OGCAPITilesSourceLoader.createDataSource(LANDING_PAGE_URL, {
    'ogc-api': options,
    core: {onError: error => errors.push(error)}
  });
  const stubFetch: typeof source.fetch = async url => {
    requestedUrls.push(url);
    const route = url in routes ? routes[url] : {status: 404};
    if (route && typeof (route as {status?: unknown}).status === 'number') {
      return new Response('error', {status: (route as {status: number}).status});
    }
    return new Response(route instanceof ArrayBuffer ? route : JSON.stringify(route));
  };
  source.fetch = stubFetch;
  return {source, requestedUrls, errors, stubFetch};
}

test('OGCAPITilesSource discovers the tile matrix set from the tileset tiling-scheme link', async () => {
  const tileMatrixSetUrl = `${LANDING_PAGE_URL}/tileMatrixSets/WebMercatorQuad`;
  const {source, requestedUrls, errors} = createSource(
    {
      [LANDING_PAGE_URL]: LANDING_PAGE,
      // The tileset is the template path before {tileMatrix}, without the tile format parameter
      [`${LANDING_PAGE_URL}/tiles/WebMercatorQuad`]: DATASET_TILESET,
      [tileMatrixSetUrl]: WEB_MERCATOR_QUAD
    },
    {tileTemplate: DATASET_TEMPLATE}
  );

  const metadata = await source.getMetadata();
  expect(errors).toEqual([]);
  expect(metadata.tileGrid?.matrixIds).toEqual(['0', '1']);
  expect(metadata.tileGrid?.crs).toBe('http://www.opengis.net/def/crs/EPSG/0/3857');
  expect(requestedUrls.sort()).toEqual(
    [LANDING_PAGE_URL, `${LANDING_PAGE_URL}/tiles/WebMercatorQuad`, tileMatrixSetUrl].sort()
  );

  // The discovered grid is reused; only the landing page is fetched again
  requestedUrls.length = 0;
  await source.getMetadata();
  expect(requestedUrls).toEqual([LANDING_PAGE_URL]);
});

test('OGCAPITilesSource resolves tileset links against the tileset document', async () => {
  // Root-relative links on a collection tileset; the HTML tiling-scheme link is skipped
  const collection = createSource(
    {
      [LANDING_PAGE_URL]: LANDING_PAGE,
      'https://example.com/ogcapi/collections/countries/map/tiles/WorldCRS84Quad':
        COLLECTION_TILESET,
      'https://example.com/ogcapi/tileMatrixSets/WorldCRS84Quad': WORLD_CRS84_QUAD
    },
    {tileTemplate: COLLECTION_TEMPLATE}
  );
  const tileGrid = (await collection.source.getMetadata()).tileGrid;
  expect(collection.errors).toEqual([]);
  expect(tileGrid?.crs).toBe('http://www.opengis.net/def/crs/OGC/1.3/CRS84');
  expect(tileGrid?.origin).toEqual([-180, 90]);
  expect(tileGrid?.matrixSizes).toEqual([
    [2, 1],
    [4, 2]
  ]);

  // A document-relative link resolves against the tileset URL, and the legacy rel is accepted
  const relative = createSource(
    {
      [LANDING_PAGE_URL]: LANDING_PAGE,
      [`${LANDING_PAGE_URL}/tiles/WebMercatorQuad`]: {
        links: [{rel: 'tiling-scheme', href: '../tileMatrixSets/WebMercatorQuad'}]
      },
      [`${LANDING_PAGE_URL}/tileMatrixSets/WebMercatorQuad`]: WEB_MERCATOR_QUAD
    },
    {tileTemplate: DATASET_TEMPLATE}
  );
  expect((await relative.source.getMetadata()).tileGrid?.matrixIds).toEqual(['0', '1']);
  expect(relative.errors).toEqual([]);
});

test('OGCAPITilesSource falls back to tileMatrixSetId and tileMatrixSetURI', async () => {
  // tileMatrixSetId without a link: the API's /tileMatrixSets/{id}
  const byId = createSource(
    {
      [LANDING_PAGE_URL]: LANDING_PAGE,
      [`${LANDING_PAGE_URL}/tiles/NamedLevels`]: {
        tileMatrixSetId: 'NamedLevels',
        links: []
      },
      [`${LANDING_PAGE_URL}/tileMatrixSets/NamedLevels`]: NAMED_LEVELS
    },
    {
      tileTemplate: `${LANDING_PAGE_URL}/tiles/NamedLevels/{tileMatrix}/{tileRow}/{tileCol}`
    }
  );
  expect((await byId.source.getMetadata()).tileGrid?.matrixIds).toEqual(['L0', 'L1']);
  expect(byId.errors).toEqual([]);

  // tileMatrixSetURI alone: the /tileMatrixSets list maps the URI to this API's id and JSON link
  const byUri = createSource(
    {
      [LANDING_PAGE_URL]: LANDING_PAGE,
      [`${LANDING_PAGE_URL}/tiles/CRS84Quad`]: {
        tileMatrixSetURI: 'http://www.opengis.net/def/tilematrixset/OGC/1.0/WorldCRS84Quad'
      },
      [`${LANDING_PAGE_URL}/tileMatrixSets`]: TILE_MATRIX_SETS,
      [`${LANDING_PAGE_URL}/tileMatrixSets/CRS84Quad?f=json`]: WORLD_CRS84_QUAD
    },
    {
      tileTemplate: `${LANDING_PAGE_URL}/tiles/CRS84Quad/{tileMatrix}/{tileRow}/{tileCol}`
    }
  );
  expect((await byUri.source.getMetadata()).tileGrid?.crs).toBe(
    'http://www.opengis.net/def/crs/OGC/1.3/CRS84'
  );
  expect(byUri.errors).toEqual([]);
});

test('OGCAPITilesSource lists and fetches tile matrix sets', async () => {
  const {source, requestedUrls} = createSource(
    {
      [`${LANDING_PAGE_URL}/tileMatrixSets`]: TILE_MATRIX_SETS,
      [`${LANDING_PAGE_URL}/tileMatrixSets/WebMercatorQuad`]: WEB_MERCATOR_QUAD
    },
    {}
  );
  expect((await source.getTileMatrixSets()).map(tileMatrixSet => tileMatrixSet.id)).toEqual([
    'WebMercatorQuad',
    'CRS84Quad'
  ]);
  expect((await source.getTileMatrixSet('WebMercatorQuad')).tileMatrices).toHaveLength(2);
  expect(requestedUrls).toEqual([
    `${LANDING_PAGE_URL}/tileMatrixSets`,
    `${LANDING_PAGE_URL}/tileMatrixSets/WebMercatorQuad`
  ]);
});

test('OGCAPITilesSource does not discover when a tile matrix set is configured', async () => {
  const {source, requestedUrls} = createSource(
    {
      [LANDING_PAGE_URL]: LANDING_PAGE,
      [`${LANDING_PAGE_URL}/tiles/WebMercatorQuad/L1/0/0?f=mvt`]: new ArrayBuffer(4)
    },
    {tileTemplate: DATASET_TEMPLATE, tileMatrixSet: NAMED_LEVELS}
  );
  expect((await source.getMetadata()).tileGrid?.matrixIds).toEqual(['L0', 'L1']);
  await source.getTile({z: 1, x: 0, y: 0});
  expect(requestedUrls).toEqual([
    LANDING_PAGE_URL,
    `${LANDING_PAGE_URL}/tiles/WebMercatorQuad/L1/0/0?f=mvt`
  ]);
});

test('OGCAPITilesSource does not discover for templates without {tileMatrix}', async () => {
  const {source, requestedUrls, errors} = createSource(
    {[LANDING_PAGE_URL]: LANDING_PAGE},
    {tileTemplate: `${LANDING_PAGE_URL}/xyz/{z}/{x}/{y}.png`}
  );
  expect((await source.getMetadata()).tileGrid).toBeUndefined();
  expect(requestedUrls).toEqual([LANDING_PAGE_URL]);
  expect(errors).toEqual([]);
});

test('OGCAPITilesSource falls back to z when discovery fails, and retries on getMetadata', async () => {
  const tilesetUrl = `${LANDING_PAGE_URL}/tiles/NamedLevels`;
  const routes: Record<string, Route> = {
    [LANDING_PAGE_URL]: LANDING_PAGE,
    [tilesetUrl]: {status: 503},
    [`${LANDING_PAGE_URL}/tileMatrixSets/NamedLevels`]: NAMED_LEVELS,
    [`${tilesetUrl}/1/0/0`]: new ArrayBuffer(4),
    [`${tilesetUrl}/L1/0/0`]: new ArrayBuffer(4)
  };
  const {source, requestedUrls, errors} = createSource(routes, {
    tileTemplate: `${tilesetUrl}/{tileMatrix}/{tileRow}/{tileCol}`
  });

  // The failure is reported, not thrown, and tiles keep using z
  const metadata = await source.getMetadata();
  expect(metadata.tileGrid).toBeUndefined();
  expect(metadata.title).toBe('Demo API');
  expect(errors).toHaveLength(1);
  expect(errors[0].message).toMatch(/tile matrix set.*503/);
  expect(source.getTileURL({z: 1, x: 0, y: 0})).toBe(`${tilesetUrl}/1/0/0`);

  // Tile requests do not retry discovery, so a failing service is not asked once per tile
  requestedUrls.length = 0;
  await source.getTile({z: 1, x: 0, y: 0});
  expect(requestedUrls).toEqual([`${tilesetUrl}/1/0/0`]);
  expect(errors).toHaveLength(1);

  // The next getMetadata() retries
  routes[tilesetUrl] = {tileMatrixSetId: 'NamedLevels'};
  expect((await source.getMetadata()).tileGrid?.matrixIds).toEqual(['L0', 'L1']);
  expect(source.getTileURL({z: 1, x: 0, y: 0})).toBe(`${tilesetUrl}/L1/0/0`);
  expect(errors).toHaveLength(1);
});

test('OGCAPITilesSource reports a tileset that names no tile matrix set', async () => {
  const {source, errors} = createSource(
    {
      [LANDING_PAGE_URL]: LANDING_PAGE,
      [`${LANDING_PAGE_URL}/tiles/WebMercatorQuad`]: {
        title: 'No tiling scheme',
        links: []
      }
    },
    {tileTemplate: DATASET_TEMPLATE}
  );
  expect((await source.getMetadata()).tileGrid).toBeUndefined();
  expect(errors).toHaveLength(1);
  expect(errors[0].message).toMatch(/tile matrix set/);
});

test('OGCAPITilesSource discovers before the first tile request', async () => {
  const tilesetUrl = `${LANDING_PAGE_URL}/tiles/NamedLevels`;
  const {source, requestedUrls} = createSource(
    {
      [tilesetUrl]: {tileMatrixSetId: 'NamedLevels'},
      [`${LANDING_PAGE_URL}/tileMatrixSets/NamedLevels`]: NAMED_LEVELS,
      [`${tilesetUrl}/L0/2/1`]: new ArrayBuffer(4)
    },
    {tileTemplate: `${tilesetUrl}/{tileMatrix}/{tileRow}/{tileCol}`}
  );
  await Promise.all([source.getTile({z: 0, x: 1, y: 2}), source.getTile({z: 0, x: 1, y: 2})]);
  // Concurrent tile requests share one discovery
  expect(requestedUrls).toEqual([
    tilesetUrl,
    `${LANDING_PAGE_URL}/tileMatrixSets/NamedLevels`,
    `${tilesetUrl}/L0/2/1`,
    `${tilesetUrl}/L0/2/1`
  ]);
});

test('OGCAPITilesSource discovers again when the tile template changes', async () => {
  const {source, stubFetch} = createSource(
    {
      [LANDING_PAGE_URL]: LANDING_PAGE,
      [`${LANDING_PAGE_URL}/tiles/WebMercatorQuad`]: DATASET_TILESET,
      [`${LANDING_PAGE_URL}/tileMatrixSets/WebMercatorQuad`]: WEB_MERCATOR_QUAD,
      [`${LANDING_PAGE_URL}/tiles/NamedLevels`]: {
        tileMatrixSetId: 'NamedLevels'
      },
      [`${LANDING_PAGE_URL}/tileMatrixSets/NamedLevels`]: NAMED_LEVELS
    },
    {tileTemplate: DATASET_TEMPLATE}
  );
  expect((await source.getMetadata()).tileGrid?.matrixIds).toEqual(['0', '1']);
  source.setProps({
    'ogc-api': {
      tileTemplate: `${LANDING_PAGE_URL}/tiles/NamedLevels/{tileMatrix}/{tileRow}/{tileCol}`
    }
  });
  // setProps() rebuilds the fetch function from options, so stub it again.
  source.fetch = stubFetch;
  // The previous tileset's grid no longer names matrices
  expect(source.getTileURL({z: 1, x: 0, y: 0})).toBe(`${LANDING_PAGE_URL}/tiles/NamedLevels/1/0/0`);
  expect((await source.getMetadata()).tileGrid?.matrixIds).toEqual(['L0', 'L1']);
  expect(source.getTileURL({z: 1, x: 0, y: 0})).toBe(
    `${LANDING_PAGE_URL}/tiles/NamedLevels/L1/0/0`
  );
});
