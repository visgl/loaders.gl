// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {Tile2DSourceLayer, type Tile2DSourceLayerProps} from '@loaders.gl/deck-layers';

const TEST_TILE_SOURCE = {
  mimeType: 'image/png',
  options: {},
  async getMetadata() {
    return {minZoom: 0, maxZoom: 1};
  },
  async getTileData() {
    return null;
  }
};

const TEST_SOURCE_FACTORY = {
  name: 'TestSource',
  id: 'test-source',
  module: 'test',
  version: '0.0.0',
  extensions: ['test'],
  mimeTypes: ['application/test'],
  type: 'tile',
  fromUrl: true,
  fromBlob: true,
  testURL: () => true,
  createDataSource() {
    return TEST_TILE_SOURCE as any;
  }
};

function createLayer(props: Tile2DSourceLayerProps = {id: 'test', data: TEST_TILE_SOURCE as any}) {
  return new Tile2DSourceLayer(props as any) as any;
}

test('Tile2DSourceLayer#resolves URL inputs with sources', t => {
  const layer = createLayer({
    id: 'test',
    data: 'https://example.com/tiles',
    sources: [TEST_SOURCE_FACTORY as any]
  });

  const resolvedData = layer._resolveData(layer.props);
  t.equal(resolvedData, TEST_TILE_SOURCE);
  t.end();
});

test('Tile2DSourceLayer#accepts direct TileSource inputs', t => {
  const layer = createLayer();
  const resolvedData = layer._resolveData(layer.props);
  t.equal(resolvedData, TEST_TILE_SOURCE);
  t.end();
});

test('Tile2DSourceLayer#detects local-coordinate MVT sources', t => {
  const layer = createLayer();
  t.ok(
    layer.sourceSupportsMVTLayer({
      ...TEST_TILE_SOURCE,
      mimeType: 'application/vnd.mapbox-vector-tile',
      localCoordinates: true
    })
  );
  t.notOk(layer.sourceSupportsMVTLayer(TEST_TILE_SOURCE));
  t.end();
});
