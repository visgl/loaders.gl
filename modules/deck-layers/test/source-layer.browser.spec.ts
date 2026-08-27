// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {SourceLayer} from '@loaders.gl/deck-layers';

const TEST_3D_LOADER = {
  id: '3d-tiles',
  name: '3D Tiles',
  module: '3d-tiles',
  version: '1.0.0',
  extensions: ['json'],
  mimeTypes: ['application/json']
};

test('SourceLayer preserves URL inputs for parser-backed 3D dispatch', () => {
  const tilesetUrl = 'https://example.com/tileset.json';
  const layer = new SourceLayer({
    id: 'tiles-3d',
    data: tilesetUrl,
    loaders: [TEST_3D_LOADER as any]
  }) as any;

  expect(layer.props.data).toBe(tilesetUrl);
  layer.initializeState();
  layer.state = {
    resolvedSource: {
      source: tilesetUrl,
      sourceType: 'tile-3d',
      parserLoaders: [TEST_3D_LOADER],
      owned: false
    },
    metadata: null,
    resolvedLayers: undefined,
    resolvedCoordinateReferenceSystem: undefined,
    isResolving: false
  };
  const childLayer = layer.renderLayers()[0];

  expect(childLayer.constructor.layerName).toBe('Tile3DSourceLayer');
  expect(childLayer.id).toBe('tiles-3d-tile-3d');
  expect(childLayer.props.data).toBe(tilesetUrl);
  expect(childLayer.props.loaders).toEqual([TEST_3D_LOADER]);
});
