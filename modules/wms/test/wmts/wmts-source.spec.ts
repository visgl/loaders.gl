// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {WMTSSourceLoader, WMTSImageTileSource} from '@loaders.gl/wms';

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
