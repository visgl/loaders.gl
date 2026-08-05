// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
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

test('BoundingBoxLayer creates edge paths for AxisAlignedBoundingBox', t => {
  const boundingBox = new AxisAlignedBoundingBox([0, 1, 2], [3, 4, 5]);
  const paths = createBoundingBoxLayerEdges([boundingBox]);

  t.equal(paths.length, 12, 'creates one path per box edge');
  t.deepEqual(
    [paths[0].sourcePosition, paths[0].targetPosition],
    [
      [0, 1, 2],
      [3, 1, 2]
    ],
    'uses the minimum z bottom edge'
  );
  t.deepEqual(
    [paths[8].sourcePosition, paths[8].targetPosition],
    [
      [0, 1, 2],
      [0, 1, 5]
    ],
    'uses vertical edges'
  );
  t.end();
});

test('BoundingBoxLayer creates edge paths for OrientedBoundingBox', t => {
  const boundingBox = new OrientedBoundingBox([10, 20, 30], [1, 0, 0, 0, 2, 0, 0, 0, 3]);
  const paths = createBoundingBoxLayerEdges([boundingBox]);

  t.equal(paths.length, 12, 'creates one path per box edge');
  t.deepEqual(paths[0].sourcePosition, [9, 18, 27], 'uses oriented box negative corner');
  t.deepEqual(paths[0].targetPosition, [11, 18, 27], 'uses oriented box positive x corner');
  t.end();
});

test('BoundingBoxLayer renders a LineLayer', t => {
  const layer = new BoundingBoxLayer({
    id: 'test-bounding-box-layer',
    data: [new AxisAlignedBoundingBox([0, 0, 0], [1, 1, 1])]
  });
  const [sublayer] = asLayerArray(layer.renderLayers());

  t.equal(sublayer.constructor.layerName, 'LineLayer', 'creates a LineLayer');
  t.equal((sublayer.props.data as unknown[]).length, 12, 'passes rendered edge data');
  t.end();
});

test('TileBoundingBoxLayer filters selected point-cloud tiles', t => {
  const selectedTile = createPointCloudTile('selected', true);
  const unselectedTile = createPointCloudTile('unselected', false);
  const layer = new TileBoundingBoxLayer({
    id: 'test-tile-bounding-box-layer',
    tiles: [selectedTile, unselectedTile],
    selectedOnly: true
  });
  const [sublayer] = asLayerArray(layer.renderLayers());
  const [lineLayer] = asLayerArray(sublayer.renderLayers());

  t.equal(sublayer.constructor.layerName, 'BoundingBoxLayer', 'creates a BoundingBoxLayer');
  t.equal((lineLayer.props.data as unknown[]).length, 12, 'renders only the selected tile');
  t.end();
});
