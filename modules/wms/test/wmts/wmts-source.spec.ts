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
