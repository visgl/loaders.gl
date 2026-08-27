// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {AxisAlignedBoundingBox, OrientedBoundingBox} from '@math.gl/culling';
import type {Layer} from '@deck.gl/core';
import {BoundingBoxLayer, createBoundingBoxLayerEdges} from '../src/bounding-box-layer';
import {TileBoundingBoxLayer} from '../src/tile-bounding-box-layer';
import {PointCloudTile} from '../../tiles/src/point-cloud/point-cloud-tile';
/** Normalizes a layer render result to an array. */
function asLayerArray(layerResult: Layer | Layer[] | null): Layer[] {
  if (!layerResult) {
    return [];
  }
  return Array.isArray(layerResult) ? layerResult : [layerResult];
}
/** Creates a point-cloud tile for TileBoundingBoxLayer tests. */
function createPointCloudTile(id: string, selected: boolean): PointCloudTile {
  const tile = new PointCloudTile({
    id,
    level: 0,
    pointCount: 1,
    geometricError: 1,
    boundingVolume: {
      cartographicBounds: [
        [0, 0, 0],
        [1, 1, 1]
      ],
      center: [0.5, 0.5, 0.5],
      radius: 1
    }
  });
  tile.selected = selected;
  return tile;
}
test('BoundingBoxLayer creates edge paths for AxisAlignedBoundingBox', () => {
  const boundingBox = new AxisAlignedBoundingBox([0, 1, 2], [3, 4, 5]);
  const paths = createBoundingBoxLayerEdges([boundingBox]);
  expect(paths.length, 'creates one path per box edge').toBe(12);
  expect(
    [paths[0].sourcePosition, paths[0].targetPosition],
    'uses the minimum z bottom edge'
  ).toEqual([
    [0, 1, 2],
    [3, 1, 2]
  ]);
  expect([paths[8].sourcePosition, paths[8].targetPosition], 'uses vertical edges').toEqual([
    [0, 1, 2],
    [0, 1, 5]
  ]);
});
test('BoundingBoxLayer creates edge paths for OrientedBoundingBox', () => {
  const boundingBox = new OrientedBoundingBox([10, 20, 30], [1, 0, 0, 0, 2, 0, 0, 0, 3]);
  const paths = createBoundingBoxLayerEdges([boundingBox]);
  expect(paths.length, 'creates one path per box edge').toBe(12);
  expect(paths[0].sourcePosition, 'uses oriented box negative corner').toEqual([9, 18, 27]);
  expect(paths[0].targetPosition, 'uses oriented box positive x corner').toEqual([11, 18, 27]);
});
test('BoundingBoxLayer renders a LineLayer', () => {
  const layer = new BoundingBoxLayer({
    id: 'test-bounding-box-layer',
    data: [new AxisAlignedBoundingBox([0, 0, 0], [1, 1, 1])]
  });
  const [sublayer] = asLayerArray(layer.renderLayers());
  expect(sublayer.constructor.layerName, 'creates a LineLayer').toBe('LineLayer');
  expect((sublayer.props.data as unknown[]).length, 'passes rendered edge data').toBe(12);
});
test('TileBoundingBoxLayer filters selected point-cloud tiles', () => {
  const selectedTile = createPointCloudTile('selected', true);
  const unselectedTile = createPointCloudTile('unselected', false);
  const layer = new TileBoundingBoxLayer({
    id: 'test-tile-bounding-box-layer',
    tiles: [selectedTile, unselectedTile],
    selectedOnly: true
  });
  const [sublayer] = asLayerArray(layer.renderLayers());
  const [lineLayer] = asLayerArray(sublayer.renderLayers());
  expect(sublayer.constructor.layerName, 'creates a BoundingBoxLayer').toBe('BoundingBoxLayer');
  expect((lineLayer.props.data as unknown[]).length, 'renders only the selected tile').toBe(12);
});
