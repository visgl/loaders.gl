// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

// This file tests behavior derived from the Cesium code base under Apache 2 license.

import test from 'tape-promise/tape';
import {Matrix4} from '@math.gl/core';
import {Tile3D} from '@loaders.gl/tiles';
import {getTiles3DScreenSpaceError} from '../../src/tileset-3d/helpers/tiles-3d-lod';
import {LOD_METRIC_TYPE, TILESET_TYPE} from '../../src/constants';

const TILE_HEADER = {
  id: 'tile',
  lodMetricValue: 10,
  lodMetricType: LOD_METRIC_TYPE.GEOMETRIC_ERROR,
  refine: 'REPLACE',
  children: [],
  boundingVolume: {sphere: [0, 0, 0, 1]}
};

const TILESET = {
  modelMatrix: new Matrix4(),
  lodMetricValue: 10,
  lodMetricType: LOD_METRIC_TYPE.GEOMETRIC_ERROR,
  type: TILESET_TYPE.TILES3D,
  options: {viewDistanceScale: 1},
  dynamicScreenSpaceError: false
};

/** Creates the minimal frame state used by the 3D Tiles SSE calculation. */
function createFrameState(overrides: {[key: string]: any} = {}) {
  return {
    height: 1000,
    sseDenominator: 2,
    viewport: {orthographic: false},
    ...overrides
  };
}

/** Creates a Tile3D with a controlled camera distance for SSE tests. */
function createTile(header: {[key: string]: any} = TILE_HEADER): Tile3D {
  const tileset = {...TILESET, options: {...TILESET.options}};
  // @ts-ignore test uses the minimal tileset shape required by Tile3D
  const tile = new Tile3D(tileset, header);
  tile._distanceToCamera = 100;
  return tile;
}

test('getTiles3DScreenSpaceError#preserves perspective calculation', t => {
  const tile = createTile();
  t.equals(
    getTiles3DScreenSpaceError(tile, createFrameState(), false),
    50,
    'projects geometric error using viewport height, distance, and denominator'
  );
  t.end();
});

test('getTiles3DScreenSpaceError#uses orthographic logical-pixel scale', t => {
  const tile = createTile();
  const frameState = createFrameState({
    height: 100,
    viewport: {orthographic: true, metersPerPixel: 2}
  });

  t.equals(
    getTiles3DScreenSpaceError(tile, frameState, false),
    5,
    'divides world-space geometric error by meters per logical pixel'
  );

  tile._distanceToCamera = 10_000;
  frameState.height = 10_000;
  t.equals(
    getTiles3DScreenSpaceError(tile, frameState, false),
    5,
    'orthographic SSE is independent of camera distance and viewport height'
  );
  t.end();
});

test('getTiles3DScreenSpaceError#applies viewDistanceScale in orthographic views', t => {
  const tile = createTile();
  tile.tileset.options.viewDistanceScale = 1.5;

  t.equals(
    getTiles3DScreenSpaceError(
      tile,
      createFrameState({viewport: {orthographic: true, metersPerPixel: 2}}),
      false
    ),
    7.5,
    'applies the application LOD scale'
  );
  t.end();
});

test('getTiles3DScreenSpaceError#does not apply device pixel ratio twice', t => {
  const tile = createTile();
  const logicalPixelFrame = createFrameState({
    viewport: {orthographic: true, metersPerPixel: 2},
    pixelRatio: 1
  });
  const highDpiFrame = createFrameState({
    viewport: {orthographic: true, metersPerPixel: 2},
    pixelRatio: 2
  });

  t.equals(
    getTiles3DScreenSpaceError(tile, highDpiFrame, false),
    getTiles3DScreenSpaceError(tile, logicalPixelFrame, false),
    'identical logical-pixel viewports select identical LODs regardless of device pixel ratio'
  );
  t.end();
});

test('getTiles3DScreenSpaceError#falls back when orthographic pixel scale is invalid', t => {
  const tile = createTile();
  for (const metersPerPixel of [undefined, 0, -1, Number.POSITIVE_INFINITY, Number.NaN]) {
    t.equals(
      getTiles3DScreenSpaceError(
        tile,
        createFrameState({viewport: {orthographic: true, metersPerPixel}}),
        false
      ),
      50,
      `falls back to perspective-compatible SSE for ${String(metersPerPixel)}`
    );
  }
  t.end();
});

test('getTiles3DScreenSpaceError#composes transformed error with orthographic SSE', t => {
  const tile = createTile({...TILE_HEADER, transform: new Matrix4().scale([2, 3, 4])});

  t.equals(tile.lodMetricValue, 40, 'geometric error uses the maximum transform scale');
  t.equals(
    getTiles3DScreenSpaceError(
      tile,
      createFrameState({viewport: {orthographic: true, metersPerPixel: 2}}),
      false
    ),
    20,
    'orthographic SSE consumes the transformed world-space error'
  );
  t.end();
});

test('getTiles3DScreenSpaceError#returns zero for zero-error leaves', t => {
  const tile = createTile({...TILE_HEADER, lodMetricValue: 0});
  t.equals(
    getTiles3DScreenSpaceError(
      tile,
      createFrameState({viewport: {orthographic: true, metersPerPixel: 2}}),
      false
    ),
    0,
    'skips projection work for zero error'
  );
  t.end();
});
