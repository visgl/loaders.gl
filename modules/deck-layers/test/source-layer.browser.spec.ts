// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {SourceLayer} from '@loaders.gl/deck-layers';
import {createSourceViewState, getSourceCoordinateReferenceSystem} from '../src/source-layer-utils';

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

test('source metadata discovery follows the first leaf and supports PROJJSON CRS identifiers', async () => {
  const metadata = {
    layers: [
      {
        name: 'group',
        layers: [
          {title: 'unnamed group', layers: [{name: 'first-leaf', boundingBox: [-20, -10, 20, 10]}]},
          {name: 'second-leaf', boundingBox: [0, 0, 1, 1]}
        ]
      }
    ],
    crs: {id: {authority: 'EPSG', code: 3857}}
  };

  const viewState = await createSourceViewState({}, metadata);

  expect(getSourceCoordinateReferenceSystem(metadata)).toBe('EPSG:3857');
  expect(viewState).toMatchObject({
    bounds: [
      [-20, -10],
      [20, 10]
    ],
    longitude: 0,
    latitude: 0,
    crs: 'EPSG:3857'
  });
});

test('SourceLayer keeps an explicitly empty layer selection', () => {
  const layer = new SourceLayer({
    id: 'explicit-empty-layers',
    data: {
      getMetadata: async () => ({layers: [{name: 'discovered'}]}),
      getSchema: async () => ({fields: [], metadata: {}}),
      getFeatures: async () => ({shape: 'geojson-table', type: 'FeatureCollection', features: []})
    } as any,
    layers: []
  }) as any;

  layer.initializeState();
  layer.state = {
    resolvedSource: {
      source: layer.props.data,
      sourceType: 'vector',
      parserLoaders: [],
      owned: false
    },
    metadata: {layers: [{name: 'discovered'}]},
    resolvedLayers: [],
    resolvedCoordinateReferenceSystem: undefined,
    isResolving: false
  };

  expect(layer.renderLayers()[0].props.layers).toEqual([]);
});
