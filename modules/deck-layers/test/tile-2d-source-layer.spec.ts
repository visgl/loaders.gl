// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {convertGeometryToWKB} from '@loaders.gl/gis';
import {Tile2DSourceLayer, type Tile2DSourceLayerProps} from '@loaders.gl/deck-layers';
import {ArrowTableBuilder} from '@loaders.gl/schema-utils';
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
const ARROW_TILE = createArrowTile();
function createLayer(props: Tile2DSourceLayerProps = {id: 'test', data: TEST_TILE_SOURCE as any}) {
  return new Tile2DSourceLayer(props as any) as any;
}
test('Tile2DSourceLayer#resolves URL inputs with sources', () => {
  const layer = createLayer({
    id: 'test',
    data: 'https://example.com/tiles',
    sources: [TEST_SOURCE_FACTORY as any]
  });
  const resolvedData = layer._resolveData(layer.props);
  expect(resolvedData).toBe(TEST_TILE_SOURCE);
});
test('Tile2DSourceLayer#accepts direct TileSource inputs', () => {
  const layer = createLayer();
  const resolvedData = layer._resolveData(layer.props);
  expect(resolvedData).toBe(TEST_TILE_SOURCE);
});
test('Tile2DSourceLayer#detects local-coordinate MVT sources', () => {
  const layer = createLayer();
  expect(
    layer.sourceSupportsMVTLayer({
      ...TEST_TILE_SOURCE,
      mimeType: 'application/vnd.mapbox-vector-tile',
      localCoordinates: true
    })
  ).toBeTruthy();
  expect(layer.sourceSupportsMVTLayer(TEST_TILE_SOURCE)).toBeFalsy();
});
test('Tile2DSourceLayer#default render path creates GeoJsonLayer for vector tiles', () => {
  const layer = createLayer();
  const renderedLayers = (layer.props as any).renderSubLayers({
    ...layer.props,
    id: 'vector-tile',
    data: [],
    _offset: 0,
    tile: {
      index: {x: 0, y: 0, z: 0},
      bbox: {west: 0, south: 0, east: 1, north: 1},
      boundingBox: [
        [0, 0],
        [1, 1]
      ]
    },
    tileSource: {
      ...TEST_TILE_SOURCE,
      mimeType: 'application/vnd.mapbox-vector-tile'
    }
  });
  expect(renderedLayers[0].constructor.layerName).toBe('GeoJsonLayer');
});
test('Tile2DSourceLayer#default render path creates GeoJsonLayer for Arrow vector tiles', () => {
  const layer = createLayer();
  const renderedLayers = (layer.props as any).renderSubLayers({
    ...layer.props,
    id: 'arrow-vector-tile',
    data: ARROW_TILE,
    _offset: 0,
    showTileBorders: false,
    tile: {
      index: {x: 0, y: 0, z: 0},
      bbox: {west: 0, south: 0, east: 1, north: 1},
      boundingBox: [
        [0, 0],
        [1, 1]
      ]
    },
    tileSource: {
      ...TEST_TILE_SOURCE,
      mimeType: 'application/vnd.mapbox-vector-tile'
    }
  });
  expect(renderedLayers[0].constructor.layerName).toBe('GeoJsonLayer');
  expect(renderedLayers[0].props.data.shape, 'passes deck.gl binary feature data').toBe(
    'binary-feature-collection'
  );
});
test('Tile2DSourceLayer#default render path creates BitmapLayer for raster tiles', () => {
  const layer = createLayer();
  const renderedLayers = (layer.props as any).renderSubLayers({
    ...layer.props,
    id: 'raster-tile',
    data: {} as any,
    _offset: 0,
    tile: {
      index: {x: 0, y: 0, z: 0},
      bbox: {west: 0, south: 0, east: 1, north: 1},
      boundingBox: [
        [0, 0],
        [1, 1]
      ]
    },
    tileSource: TEST_TILE_SOURCE
  });
  expect(renderedLayers[0].constructor.layerName).toBe('BitmapLayer');
});
function createArrowTile() {
  const schema = {
    fields: [
      {name: 'name', type: 'utf8', nullable: true, metadata: {}},
      {
        name: 'geometry',
        type: 'binary',
        nullable: true,
        metadata: {'ARROW:extension:name': 'geoarrow.wkb'}
      }
    ],
    metadata: {
      geo: JSON.stringify({
        version: '1.1.0',
        primary_column: 'geometry',
        columns: {geometry: {encoding: 'wkb', geometry_types: ['Point']}}
      })
    }
  };
  const builder = new ArrowTableBuilder(schema);
  builder.addObjectRow({
    name: 'arrow tile',
    geometry: new Uint8Array(convertGeometryToWKB({type: 'Point', coordinates: [1, 2]}))
  });
  return builder.finishTable();
}
