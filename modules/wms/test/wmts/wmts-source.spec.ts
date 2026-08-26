// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {WMTSSourceLoader, WMTSImageTileSource} from '@loaders.gl/wms';
import {WMTSCapabilitiesLoader} from '@loaders.gl/wms';

const WMTS_URL = 'https://example.com/wmts?token=abc';

test('WMTSImageTileSource#getTileURL preserves endpoint parameters', t => {
  const source = new WMTSImageTileSource(WMTS_URL, {
    wmts: {layer: 'basemap', tileMatrixSet: 'WebMercatorQuad'}
  });
  const url = new URL(source.getTileURL({x: 3, y: 4, z: 5}));

  t.equal(url.searchParams.get('token'), 'abc');
  t.equal(url.searchParams.get('LAYER'), 'basemap');
  t.equal(url.searchParams.get('TILEMATRIX'), '5');
  t.equal(url.searchParams.get('TILEROW'), '4');
  t.equal(url.searchParams.get('TILECOL'), '3');
  t.end();
});

test('WMTSImageTileSource#getTileURL expands REST templates', t => {
  const source = WMTSSourceLoader.createDataSource(
    'https://example.com/{TileMatrix}/{TileRow}/{TileCol}.png',
    {
      wmts: {urlTemplate: 'https://tiles.example/{TileMatrix}/{TileRow}/{TileCol}.png'}
    }
  );
  t.equal(source.getTileURL({x: 1, y: 2, z: 3}), 'https://tiles.example/3/2/1.png');
  t.end();
});

test('WMTSCapabilitiesLoader normalizes layers and tile matrices', async t => {
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

  t.equal(parsed.contents.layers[0].identifier, 'basemap');
  t.equal(parsed.contents.layers[0].resourceURLs[0].template.includes('{TileRow}'), true);
  t.equal(parsed.contents.tileMatrixSets[0].matrices[0].matrixWidth, 1);
  t.end();
});

test('WMTSImageTileSource derives URL options from capabilities', async t => {
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
  t.equal(source.getTileURL({x: 1, y: 2, z: 3}), 'https://tiles.example/3/2/1.png');
  t.end();
});
