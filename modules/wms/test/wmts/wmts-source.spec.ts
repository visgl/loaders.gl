// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {WMTSSourceLoader, WMTSImageTileSource} from '@loaders.gl/wms';
import {WMTSCapabilitiesLoader} from '@loaders.gl/wms';

const WMTS_URL = 'https://example.com/wmts?token=abc';

test('WMTSImageTileSource#getTileURL preserves endpoint parameters', () => {
  const source = new WMTSImageTileSource(WMTS_URL, {
    wmts: {layer: 'basemap', tileMatrixSet: 'WebMercatorQuad'}
  });
  const url = new URL(source.getTileURL({x: 3, y: 4, z: 5}));

  expect(url.searchParams.get('token')).toBe('abc');
  expect(url.searchParams.get('LAYER')).toBe('basemap');
  expect(url.searchParams.get('TILEMATRIX')).toBe('5');
  expect(url.searchParams.get('TILEROW')).toBe('4');
  expect(url.searchParams.get('TILECOL')).toBe('3');
});

test('WMTSImageTileSource#getTileURL expands REST templates', () => {
  const source = WMTSSourceLoader.createDataSource(
    'https://example.com/{TileMatrix}/{TileRow}/{TileCol}.png',
    {
      wmts: {urlTemplate: 'https://tiles.example/{TileMatrix}/{TileRow}/{TileCol}.png'}
    }
  );
  expect(source.getTileURL({x: 1, y: 2, z: 3})).toBe('https://tiles.example/3/2/1.png');
});

test('WMTSCapabilitiesLoader normalizes layers and tile matrices', async () => {
  const capabilities = await WMTSCapabilitiesLoader.preload();
  const parsed = capabilities.parseTextSync(`
    <Capabilities xmlns="http://www.opengis.net/wmts/1.0">
      <ServiceIdentification><Title>Example tiles</Title></ServiceIdentification>
      <Contents>
        <Layer>
          <Identifier>basemap</Identifier><Title>Basemap</Title>
          <Format>image/png</Format>
          <Style isDefault="true"><Identifier>default</Identifier></Style>
          <TileMatrixSetLink><TileMatrixSet>WebMercatorQuad</TileMatrixSet></TileMatrixSetLink>
          <ResourceURL format="image/png" resourceType="tile" template="https://tiles.example/{TileMatrix}/{TileRow}/{TileCol}.png"/>
        </Layer>
        <TileMatrixSet>
          <Identifier>WebMercatorQuad</Identifier><SupportedCRS>EPSG:3857</SupportedCRS>
          <TileMatrix><Identifier>0</Identifier><ScaleDenominator>559082264</ScaleDenominator>
            <TopLeftCorner>-20037508 20037508</TopLeftCorner><TileWidth>256</TileWidth><TileHeight>256</TileHeight>
            <MatrixWidth>1</MatrixWidth><MatrixHeight>1</MatrixHeight>
          </TileMatrix>
        </TileMatrixSet>
      </Contents>
    </Capabilities>`);

  expect(parsed.contents.layers[0].identifier).toBe('basemap');
  expect(parsed.contents.layers[0].resourceURLs[0].template).toContain('{TileRow}');
  expect(parsed.contents.tileMatrixSets[0].matrices[0].matrixWidth).toBe(1);
});

test('WMTSImageTileSource derives URL options from capabilities', async () => {
  const source = new WMTSImageTileSource('https://example.com/wmts', {
    wmts: {
      capabilities: {
        contents: {
          layers: [
            {
              identifier: 'basemap',
              formats: ['image/png'],
              styles: [],
              tileMatrixSetLinks: [{tileMatrixSet: 'WebMercatorQuad'}],
              resourceURLs: [
                {template: 'https://tiles.example/{TileMatrix}/{TileRow}/{TileCol}.png'}
              ]
            }
          ],
          tileMatrixSets: []
        }
      }
    }
  });
  await source.getMetadata();
  expect(source.getTileURL({x: 1, y: 2, z: 3})).toBe('https://tiles.example/3/2/1.png');
});

test('WMTSImageTileSource selects CRS-compatible matrix identifiers', async () => {
  const source = new WMTSImageTileSource('https://example.com/wmts', {
    wmts: {
      layer: 'imagery',
      crs: 'EPSG:3857',
      capabilities: {
        contents: {
          layers: [
            {
              identifier: 'imagery',
              formats: ['image/png'],
              styles: [],
              tileMatrixSetLinks: [
                {tileMatrixSet: 'Geographic'},
                {tileMatrixSet: 'WebMercatorQuad'}
              ],
              resourceURLs: [
                {template: 'https://tiles.example/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}'}
              ]
            }
          ],
          tileMatrixSets: [
            {identifier: 'Geographic', supportedCRS: 'EPSG:4326', matrices: [{identifier: '4'}]},
            {
              identifier: 'WebMercatorQuad',
              supportedCRS: 'EPSG:3857',
              matrices: [{identifier: 'L04'}]
            }
          ]
        }
      }
    }
  });
  await source.getMetadata();
  expect(source.getTileURL({x: 1, y: 2, z: 0})).toBe(
    'https://tiles.example/WebMercatorQuad/L04/2/1'
  );
});

test('WMTSImageTileSource uses advertised nonnumeric matrix identifiers', async () => {
  const source = new WMTSImageTileSource('https://example.com/wmts', {
    wmts: {
      layer: 'imagery',
      tileMatrixSet: 'Custom',
      capabilities: {
        contents: {
          layers: [
            {
              identifier: 'imagery',
              formats: ['image/png'],
              styles: [],
              tileMatrixSetLinks: [{tileMatrixSet: 'Custom'}],
              resourceURLs: [
                {template: 'https://tiles.example/{TileMatrix}/{TileRow}/{TileCol}.png'}
              ]
            }
          ],
          tileMatrixSets: [
            {
              identifier: 'Custom',
              supportedCRS: 'EPSG:3857',
              matrices: [{identifier: '2g'}, {identifier: '1g'}]
            }
          ]
        }
      }
    }
  });

  await source.getMetadata();
  expect(source.getTileURL({x: 1, y: 2, z: 1})).toBe('https://tiles.example/1g/2/1.png');
});

test('WMTSImageTileSource exposes the selected tile grid', async () => {
  const source = new WMTSImageTileSource('https://example.com/wmts', {
    wmts: {
      layer: 'imagery',
      tileMatrixSet: 'WebMercatorQuad',
      capabilities: {
        contents: {
          layers: [
            {
              identifier: 'imagery',
              formats: ['image/png'],
              styles: [],
              tileMatrixSetLinks: [{tileMatrixSet: 'WebMercatorQuad'}],
              resourceURLs: []
            }
          ],
          tileMatrixSets: [
            {
              identifier: 'WebMercatorQuad',
              supportedCRS: 'EPSG:3857',
              matrices: [
                {
                  identifier: '0',
                  tileWidth: 256,
                  tileHeight: 256,
                  topLeftCorner: [-20037508, 20037508],
                  matrixWidth: 1,
                  matrixHeight: 1
                }
              ]
            }
          ]
        }
      }
    }
  });

  const metadata = await source.getMetadata();
  expect(metadata.tileGrid).toEqual({
    crs: 'EPSG:3857',
    tileSize: [256, 256],
    origin: [-20037508, 20037508],
    matrixIds: ['0'],
    matrixSizes: [[1, 1]]
  });
});

test('WMTSImageTileSource uses advertised identifiers for KVP requests', async () => {
  const source = new WMTSImageTileSource('https://example.com/wmts', {
    wmts: {
      layer: 'imagery',
      tileMatrixSet: 'Custom',
      capabilities: {
        contents: {
          layers: [
            {
              identifier: 'imagery',
              formats: ['image/png'],
              styles: [],
              tileMatrixSetLinks: [{tileMatrixSet: 'Custom'}],
              resourceURLs: []
            }
          ],
          tileMatrixSets: [
            {
              identifier: 'Custom',
              supportedCRS: 'EPSG:3857',
              matrices: [{identifier: '2g'}, {identifier: '1g'}]
            }
          ]
        }
      }
    }
  });

  await source.getMetadata();
  expect(new URL(source.getTileURL({x: 1, y: 2, z: 1})).searchParams.get('TILEMATRIX')).toBe('1g');
});

test('WMTSImageTileSource preserves an exact advertised matrix identifier', async () => {
  const source = new WMTSImageTileSource('https://example.com/wmts', {
    wmts: {
      layer: 'imagery',
      tileMatrixSet: 'Custom',
      capabilities: {
        contents: {
          layers: [
            {
              identifier: 'imagery',
              formats: ['image/png'],
              styles: [],
              tileMatrixSetLinks: [{tileMatrixSet: 'Custom'}],
              resourceURLs: [{template: 'https://tiles.example/{TileMatrix}'}]
            }
          ],
          tileMatrixSets: [
            {
              identifier: 'Custom',
              supportedCRS: 'EPSG:3857',
              matrices: [{identifier: '5'}]
            }
          ]
        }
      }
    }
  });

  await source.getMetadata();
  expect(source.getTileURL({x: 0, y: 0, z: 5})).toBe('https://tiles.example/5');
});

test('WMTS capabilities select tile resources, default styles, formats and CRS units', async () => {
  const parser = await WMTSCapabilitiesLoader.preload();
  const capabilities = parser.parseTextSync(`<Capabilities><Contents>
    <Layer><Identifier>roads</Identifier><Format>image/jpeg</Format>
      <Style isDefault="true"><Identifier>day time</Identifier></Style>
      <TileMatrixSetLink><TileMatrixSet>geographic</TileMatrixSet></TileMatrixSetLink>
      <ResourceURL resourceType="FeatureInfo" format="image/jpeg" template="https://example.com/info"/>
      <ResourceURL resourceType="tile" format="image/jpeg" template="https://example.com/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}"/>
    </Layer>
    <TileMatrixSet><Identifier>geographic</Identifier><SupportedCRS>urn:ogc:def:crs:EPSG::4326</SupportedCRS>
      <TileMatrix><Identifier>level0</Identifier><ScaleDenominator>1000</ScaleDenominator><TopLeftCorner>90 -180</TopLeftCorner><TileWidth>256</TileWidth><TileHeight>256</TileHeight><MatrixWidth>2</MatrixWidth><MatrixHeight>1</MatrixHeight></TileMatrix>
      <TileMatrix><Identifier>level1</Identifier></TileMatrix>
    </TileMatrixSet></Contents></Capabilities>`);
  const source = new WMTSImageTileSource(WMTS_URL, {wmts: {capabilities}});
  expect(source.getTileURL({x: 0, y: 0, z: 0})).toBe(
    'https://example.com/day%20time/geographic/level0/0/0'
  );
  const metadata = await source.getMetadata();
  expect(metadata.format).toBe('image/jpeg');
  expect(metadata.tileGrid?.origin).toEqual([-180, 90]);
  expect(metadata.tileGrid?.matrixSizes).toBeUndefined();
  expect(capabilities.contents.tileMatrixSets[0].matrices[1].scaleDenominator).toBeUndefined();
  capabilities.contents.tileMatrixSets[0].matrices.pop();
  expect((await source.getMetadata()).tileGrid?.resolutions?.[0]).toBeCloseTo(
    0.28 / ((2 * Math.PI * 6378137) / 360)
  );
  capabilities.contents.layers[0].resourceURLs = [];
  const url = new URL(source.getTileURL({x: 0, y: 0, z: 0}));
  expect(url.searchParams.get('STYLE')).toBe('day time');
  expect(url.searchParams.get('FORMAT')).toBe('image/jpeg');
  expect(() =>
    new WMTSImageTileSource(WMTS_URL, {wmts: {capabilities, crs: 'EPSG:3857'}}).getTileURL({
      x: 0,
      y: 0,
      z: 0
    })
  ).toThrow('supports');
  expect(() =>
    new WMTSImageTileSource(WMTS_URL, {wmts: {capabilities, tileMatrixSet: 'missing'}}).getTileURL({
      x: 0,
      y: 0,
      z: 0
    })
  ).toThrow('not linked');
  expect(() =>
    new WMTSImageTileSource(WMTS_URL, {wmts: {capabilities, layer: 'missing'}}).getTileURL({
      x: 0,
      y: 0,
      z: 0
    })
  ).toThrow('Unknown');
});

test('WMTS capabilities requests retry after a failure', async () => {
  const source = new WMTSImageTileSource(WMTS_URL, {wmts: {capabilitiesUrl: WMTS_URL}});
  let requests = 0;
  source.fetch = async () =>
    ++requests === 1
      ? new Response('', {status: 503})
      : new Response('<Capabilities><Contents/></Capabilities>');
  await expect(source.getMetadata()).rejects.toThrow('503');
  await source.getMetadata();
  await source.getMetadata();
  expect(requests).toBe(2);
});

test('WMTS template dimensions are encoded and missing values fail explicitly', () => {
  const template = 'https://example.com/{Layer}/{Style}/{Time}/{TileMatrix}';
  const source = new WMTSImageTileSource(WMTS_URL, {
    wmts: {urlTemplate: template, layer: 'a/b', parameters: {Time: '2026-01-01T00:00:00Z'}}
  });
  expect(source.getTileURL({x: 0, y: 0, z: 0})).toBe(
    'https://example.com/a%2Fb/default/2026-01-01T00%3A00%3A00Z/0'
  );
  const missing = new WMTSImageTileSource(WMTS_URL, {wmts: {urlTemplate: template}});
  expect(() => missing.getTileURL({x: 0, y: 0, z: 0})).toThrow('Time');
});
