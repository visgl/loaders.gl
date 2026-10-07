// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {OGCTileMatrixSet} from '@loaders.gl/wms';
import {convertOGCTileMatrixSetToTileGrid, OGCAPITilesSourceLoader} from '@loaders.gl/wms';

/** The first two levels of the OGC WebMercatorQuad registry entry. */
const WEB_MERCATOR_QUAD: OGCTileMatrixSet = {
  id: 'WebMercatorQuad',
  uri: 'http://www.opengis.net/def/tilematrixset/OGC/1.0/WebMercatorQuad',
  crs: 'http://www.opengis.net/def/crs/EPSG/0/3857',
  orderedAxes: ['X', 'Y'],
  tileMatrices: [
    {
      id: '0',
      scaleDenominator: 559082264.028717,
      cellSize: 156543.033928041,
      cornerOfOrigin: 'topLeft',
      pointOfOrigin: [-20037508.3427892, 20037508.3427892],
      tileWidth: 256,
      tileHeight: 256,
      matrixWidth: 1,
      matrixHeight: 1
    },
    {
      id: '1',
      scaleDenominator: 279541132.014358,
      cellSize: 78271.5169640204,
      cornerOfOrigin: 'topLeft',
      pointOfOrigin: [-20037508.3427892, 20037508.3427892],
      tileWidth: 256,
      tileHeight: 256,
      matrixWidth: 2,
      matrixHeight: 2
    }
  ]
};

/** A UTM grid given only by scale denominators, with a bottom-left origin and a `{uri}` CRS. */
const UTM_BOTTOM_LEFT: OGCTileMatrixSet = {
  id: 'utm18n',
  crs: {uri: 'http://www.opengis.net/def/crs/EPSG/0/32618'},
  tileMatrices: [
    {
      id: 'coarse',
      scaleDenominator: 1000000,
      cornerOfOrigin: 'bottomLeft',
      pointOfOrigin: [200000, 4000000],
      tileWidth: 512,
      tileHeight: 512,
      matrixWidth: 4,
      matrixHeight: 3
    }
  ]
};

test('convertOGCTileMatrixSetToTileGrid converts a well-known matrix set', () => {
  const tileGrid = convertOGCTileMatrixSetToTileGrid(WEB_MERCATOR_QUAD);
  expect(tileGrid.crs).toBe('http://www.opengis.net/def/crs/EPSG/0/3857');
  expect(tileGrid.matrices).toEqual([
    {
      id: '0',
      resolution: 156543.033928041,
      origin: [-20037508.3427892, 20037508.3427892],
      tileSize: [256, 256],
      matrixSize: [1, 1]
    },
    {
      id: '1',
      resolution: 78271.5169640204,
      origin: [-20037508.3427892, 20037508.3427892],
      tileSize: [256, 256],
      matrixSize: [2, 2]
    }
  ]);
  expect(tileGrid.resolutions).toEqual([156543.033928041, 78271.5169640204]);
  expect(tileGrid.matrixIds).toEqual(['0', '1']);
  expect(tileGrid.tileSize).toEqual([256, 256]);
});

test('convertOGCTileMatrixSetToTileGrid returns origins in XY order', () => {
  const geographic = (orderedAxes: string[] | undefined, pointOfOrigin: number[]) =>
    convertOGCTileMatrixSetToTileGrid({
      crs: 'http://www.opengis.net/def/crs/EPSG/0/4326',
      orderedAxes,
      tileMatrices: [{id: '0', cellSize: 0.703125, pointOfOrigin}]
    }).matrices?.[0].origin;

  // Declared axes win over the CRS: latitude first is swapped, longitude first is kept.
  expect(geographic(['Lat', 'Lon'], [90, -180])).toEqual([-180, 90]);
  expect(geographic(['Lon', 'Lat'], [-180, 90])).toEqual([-180, 90]);
  // Without declared axes, the EPSG:4326 service rule applies.
  expect(geographic(undefined, [90, -180])).toEqual([-180, 90]);

  const northingFirst = convertOGCTileMatrixSetToTileGrid({
    crs: 'http://www.opengis.net/def/crs/EPSG/0/3006',
    orderedAxes: ['N', 'E'],
    tileMatrices: [{id: '0', cellSize: 4096, pointOfOrigin: [8500000, -1200000]}]
  });
  expect(northingFirst.matrices?.[0].origin).toEqual([-1200000, 8500000]);

  // Descriptive and south-oriented axis names also put the north-south coordinate first.
  expect(geographic(['Geodetic latitude', 'Geodetic longitude'], [90, -180])).toEqual([-180, 90]);
  expect(geographic(['S', 'W'], [90, -180])).toEqual([-180, 90]);
  expect(geographic(['Geodetic_latitude', 'Geodetic_longitude'], [90, -180])).toEqual([-180, 90]);
  expect(geographic(['φ', 'λ'], [90, -180])).toEqual([-180, 90]);
  expect(geographic(['Easting', 'Northing'], [-180, 90])).toEqual([-180, 90]);
});

test('convertOGCTileMatrixSetToTileGrid keeps a bottom-left corner and needs projected units', () => {
  const withoutUnits = convertOGCTileMatrixSetToTileGrid(UTM_BOTTOM_LEFT);
  expect(withoutUnits.crs).toBe('http://www.opengis.net/def/crs/EPSG/0/32618');
  expect(withoutUnits.matrices?.[0]).toEqual({
    id: 'coarse',
    origin: [200000, 4000000],
    cornerOfOrigin: 'bottomLeft',
    tileSize: [512, 512],
    matrixSize: [4, 3]
  });
  expect(withoutUnits.resolutions).toBeUndefined();
  // The grid-wide origin is documented as top-left, so a bottom-left origin stays per-level.
  expect(withoutUnits.origin).toBeUndefined();

  const withUnits = convertOGCTileMatrixSetToTileGrid(UTM_BOTTOM_LEFT, {metersPerUnit: 1});
  expect(withUnits.matrices?.[0].resolution).toBeCloseTo(280);
});

test('convertOGCTileMatrixSetToTileGrid rejects malformed input', () => {
  expect(() =>
    convertOGCTileMatrixSetToTileGrid({id: 'empty'} as unknown as OGCTileMatrixSet)
  ).toThrow('tileMatrices');
  expect(() => convertOGCTileMatrixSetToTileGrid(UTM_BOTTOM_LEFT, {metersPerUnit: -1})).toThrow(
    'metersPerUnit'
  );
  expect(() =>
    convertOGCTileMatrixSetToTileGrid({
      tileMatrices: [{cellSize: 1} as unknown as OGCTileMatrixSet['tileMatrices'][0]]
    })
  ).toThrow('string id');
  // An embedded CRS definition is not interpreted, so no identifier is reported.
  expect(convertOGCTileMatrixSetToTileGrid({crs: {wkt: {}}, tileMatrices: []}).crs).toBeUndefined();
});

test('convertOGCTileMatrixSetToTileGrid reads a bottom-left corner in any letter case', () => {
  const tileGrid = convertOGCTileMatrixSetToTileGrid({
    tileMatrices: [
      {id: '0', cellSize: 1, cornerOfOrigin: 'BottomLeft' as 'bottomLeft', pointOfOrigin: [0, 0]}
    ]
  });
  expect(tileGrid.matrices?.[0].cornerOfOrigin).toBe('bottomLeft');
  expect(tileGrid.origin).toBeUndefined();
});

test('OGCAPITilesSource#getMetadata reports a configured tile matrix set', async () => {
  const landingPageUrl = 'https://example.com/ogcapi';
  const tileMatrixSetUrl = `${landingPageUrl}/tileMatrixSets/WebMercatorQuad`;
  const requestedUrls: string[] = [];
  const source = OGCAPITilesSourceLoader.createDataSource(landingPageUrl, {
    'ogc-api': {tileMatrixSet: tileMatrixSetUrl}
  });
  source.fetch = async url => {
    requestedUrls.push(url);
    return new Response(
      JSON.stringify(url === tileMatrixSetUrl ? WEB_MERCATOR_QUAD : {title: 'Demo API'})
    );
  };

  const metadata = await source.getMetadata();
  expect(requestedUrls.sort()).toEqual([landingPageUrl, tileMatrixSetUrl]);
  expect(metadata.tileGrid?.matrixIds).toEqual(['0', '1']);
  // The matrix set is static, so a second call fetches only the landing page.
  await source.getMetadata();
  expect(requestedUrls.filter(url => url === tileMatrixSetUrl)).toHaveLength(1);

  // A relative link resolves against the landing page.
  const relative = OGCAPITilesSourceLoader.createDataSource(landingPageUrl, {
    'ogc-api': {tileMatrixSet: 'tileMatrixSets/WebMercatorQuad'}
  });
  relative.fetch = source.fetch;
  expect((await relative.getMetadata()).tileGrid?.matrixIds).toEqual(['0', '1']);

  expect(() =>
    OGCAPITilesSourceLoader.createDataSource(landingPageUrl, {'ogc-api': {metersPerUnit: 0}})
  ).toThrow('metersPerUnit');

  const inline = OGCAPITilesSourceLoader.createDataSource(landingPageUrl, {
    'ogc-api': {tileMatrixSet: UTM_BOTTOM_LEFT, metersPerUnit: 1}
  });
  inline.fetch = async () => new Response(JSON.stringify({title: 'Demo API'}));
  expect((await inline.getMetadata()).tileGrid?.resolutions?.[0]).toBeCloseTo(280);

  const unconfigured = OGCAPITilesSourceLoader.createDataSource(landingPageUrl, {});
  unconfigured.fetch = async () => new Response(JSON.stringify({title: 'Demo API'}));
  expect((await unconfigured.getMetadata()).tileGrid).toBeUndefined();
});

test('OGCAPITilesSource resolves tile matrix set links like directory paths', async () => {
  const requestUrls = async (landingPageUrl: string, tileMatrixSet: string) => {
    const requestedUrls: string[] = [];
    const source = OGCAPITilesSourceLoader.createDataSource(landingPageUrl, {
      'ogc-api': {tileMatrixSet}
    });
    source.fetch = async url => {
      requestedUrls.push(url);
      return new Response(
        JSON.stringify(url === landingPageUrl ? {title: 'Demo API'} : WEB_MERCATOR_QUAD)
      );
    };
    await source.getMetadata();
    return requestedUrls.filter(url => url !== landingPageUrl);
  };

  // A query string on the landing page does not swallow its last path segment.
  expect(
    await requestUrls('https://example.com/ogc?apikey=K', 'tileMatrixSets/WebMercatorQuad')
  ).toEqual(['https://example.com/ogc/tileMatrixSets/WebMercatorQuad']);
  // A relative landing page, such as a same-origin proxy, keeps relative and absolute links working.
  expect(await requestUrls('/proxy/ogc', 'tileMatrixSets/WebMercatorQuad')).toEqual([
    '/proxy/ogc/tileMatrixSets/WebMercatorQuad'
  ]);
  expect(await requestUrls('/proxy/ogc', 'https://tms.example/WebMercatorQuad')).toEqual([
    'https://tms.example/WebMercatorQuad'
  ]);
});

test('OGCAPITilesSource retries a failed tile matrix set and follows option changes', async () => {
  const landingPageUrl = 'https://example.com/ogcapi';
  let failNextTileMatrixSet = true;
  const source = OGCAPITilesSourceLoader.createDataSource(landingPageUrl, {
    'ogc-api': {tileMatrixSet: `${landingPageUrl}/tileMatrixSets/WebMercatorQuad`}
  });
  const stubFetch: typeof source.fetch = async url => {
    if (url === landingPageUrl) return new Response(JSON.stringify({title: 'Demo API'}));
    if (failNextTileMatrixSet) {
      failNextTileMatrixSet = false;
      return new Response('unavailable', {status: 503});
    }
    return new Response(JSON.stringify(WEB_MERCATOR_QUAD));
  };
  source.fetch = stubFetch;

  await expect(source.getMetadata()).rejects.toThrow('503');
  expect((await source.getMetadata()).tileGrid?.matrixIds).toEqual(['0', '1']);

  source.setProps({'ogc-api': {tileMatrixSet: UTM_BOTTOM_LEFT, metersPerUnit: 1}});
  // setProps() rebuilds the fetch function from options, so stub it again.
  source.fetch = stubFetch;
  expect((await source.getMetadata()).tileGrid?.matrixIds).toEqual(['coarse']);
});
