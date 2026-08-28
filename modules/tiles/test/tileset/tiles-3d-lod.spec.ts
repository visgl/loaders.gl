// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

import {expect, test} from 'vitest';
import {Matrix4} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {Tile3D} from '@loaders.gl/tiles';
import type {FrameState} from '../../src/tileset-3d/helpers/frame-state';
import {
  calculateDynamicScreenSpaceErrorDensity,
  getDynamicScreenSpaceError,
  getDynamicScreenSpaceErrorFog,
  getTiles3DScreenSpaceError,
  updateRootTransformForDynamicScreenSpaceError
} from '../../src/tileset-3d/helpers/tiles-3d-lod';
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
  ellipsoid: Ellipsoid.WGS84,
  options: {
    viewDistanceScale: 1,
    dynamicScreenSpaceError: false,
    dynamicScreenSpaceErrorFactor: 24
  }
};
const DYNAMIC_SCREEN_SPACE_ERROR_OPTIONS = {
  dynamicScreenSpaceErrorDensity: 2.0e-4,
  dynamicScreenSpaceErrorFactor: 24,
  dynamicScreenSpaceErrorHeightFalloff: 0.25
};
/** Creates the minimal frame state used by the 3D Tiles SSE calculation. */
function createFrameState(overrides: {[key: string]: any} = {}): FrameState {
  const camera = {
    position: [0, 0, 5],
    direction: [1, 0, 0],
    up: [0, 0, 1],
    cartographicPosition: [0, 0, 5]
  };
  const frameState = {
    camera,
    height: 1000,
    sseDenominator: 2,
    viewport: {orthographic: false},
    dynamicScreenSpaceErrorDensity: 0,
    ...overrides
  };
  frameState.camera = {...camera, ...overrides.camera};
  // Tests exercise calculations that do not require culling or the top-down viewport.
  return frameState as unknown as FrameState;
}
/** Creates a Tile3D with a controlled camera distance for SSE tests. */
function createTile(header: {[key: string]: any} = TILE_HEADER): Tile3D {
  const tileset = {...TILESET, options: {...TILESET.options}};
  // @ts-ignore test uses the minimal tileset shape required by Tile3D
  const tile = new Tile3D(tileset, header);
  tile._distanceToCamera = 100;
  return tile;
}
test('getTiles3DScreenSpaceError#preserves perspective calculation', () => {
  const tile = createTile();
  expect(
    getTiles3DScreenSpaceError(tile, createFrameState(), false),
    'projects geometric error using viewport height, distance, and denominator'
  ).toBe(50);
});
test('getTiles3DScreenSpaceError#scales progressive-resolution perspective height', () => {
  const tile = createTile();
  expect(
    getTiles3DScreenSpaceError(tile, createFrameState(), false, 0.3),
    'calculates coarse-pass SSE at 30% of logical viewport height'
  ).toBe(15);
});
test('getTiles3DScreenSpaceError#composes progressive and dynamic perspective SSE', () => {
  const tile = createTile();
  tile.tileset.options.dynamicScreenSpaceError = true;
  const frameState = createFrameState({dynamicScreenSpaceErrorDensity: 0.01});
  const expectedReduction = getDynamicScreenSpaceError(100, 0.01, 24);
  expect(
    getTiles3DScreenSpaceError(tile, frameState, false, 0.3),
    'scales the projection term before applying the unchanged dynamic SSE reduction'
  ).toBe(15 - expectedReduction);
});
test('getTiles3DScreenSpaceError#uses orthographic logical-pixel scale', () => {
  const tile = createTile();
  const frameState = createFrameState({
    height: 100,
    viewport: {orthographic: true, metersPerPixel: 2}
  });
  expect(
    getTiles3DScreenSpaceError(tile, frameState, false),
    'divides world-space geometric error by meters per logical pixel'
  ).toBe(5);
  tile._distanceToCamera = 10000;
  frameState.height = 10000;
  expect(
    getTiles3DScreenSpaceError(tile, frameState, false),
    'orthographic SSE is independent of camera distance and viewport height'
  ).toBe(5);
});
test('getTiles3DScreenSpaceError#scales progressive-resolution orthographic pixels', () => {
  const tile = createTile();
  expect(
    getTiles3DScreenSpaceError(
      tile,
      createFrameState({viewport: {orthographic: true, metersPerPixel: 2}}),
      false,
      0.3
    ),
    'represents the same tile in a reduced-height logical-pixel pass'
  ).toBe(1.5);
});
test('getTiles3DScreenSpaceError#applies viewDistanceScale in orthographic views', () => {
  const tile = createTile();
  tile.tileset.options.viewDistanceScale = 1.5;
  expect(
    getTiles3DScreenSpaceError(
      tile,
      createFrameState({viewport: {orthographic: true, metersPerPixel: 2}}),
      false
    ),
    'applies the application LOD scale'
  ).toBe(7.5);
});
test('getTiles3DScreenSpaceError#does not apply device pixel ratio twice', () => {
  const tile = createTile();
  const logicalPixelFrame = createFrameState({
    viewport: {orthographic: true, metersPerPixel: 2},
    pixelRatio: 1
  });
  const highDpiFrame = createFrameState({
    viewport: {orthographic: true, metersPerPixel: 2},
    pixelRatio: 2
  });
  expect(
    getTiles3DScreenSpaceError(tile, highDpiFrame, false),
    'identical logical-pixel viewports select identical LODs regardless of device pixel ratio'
  ).toBe(getTiles3DScreenSpaceError(tile, logicalPixelFrame, false));
});
test('getTiles3DScreenSpaceError#falls back when orthographic pixel scale is invalid', () => {
  const tile = createTile();
  for (const metersPerPixel of [undefined, 0, -1, Number.POSITIVE_INFINITY, Number.NaN]) {
    expect(
      getTiles3DScreenSpaceError(
        tile,
        createFrameState({viewport: {orthographic: true, metersPerPixel}}),
        false
      ),
      `falls back to perspective-compatible SSE for ${String(metersPerPixel)}`
    ).toBe(50);
  }
});
test('getTiles3DScreenSpaceError#composes transformed error with orthographic SSE', () => {
  const tile = createTile({...TILE_HEADER, transform: new Matrix4().scale([2, 3, 4])});
  expect(tile.lodMetricValue, 'geometric error uses the maximum transform scale').toBe(40);
  expect(
    getTiles3DScreenSpaceError(
      tile,
      createFrameState({viewport: {orthographic: true, metersPerPixel: 2}}),
      false
    ),
    'orthographic SSE consumes the transformed world-space error'
  ).toBe(20);
});
test('getTiles3DScreenSpaceError#returns zero for zero-error leaves', () => {
  const tile = createTile({...TILE_HEADER, lodMetricValue: 0});
  expect(
    getTiles3DScreenSpaceError(
      tile,
      createFrameState({viewport: {orthographic: true, metersPerPixel: 2}}),
      false
    ),
    'skips projection work for zero error'
  ).toBe(0);
});
test('dynamic screen-space error#uses exponential fog', () => {
  expect(getDynamicScreenSpaceErrorFog(0, 0.01), 'zero distance has no fog').toBe(0);
  expect(
    getDynamicScreenSpaceErrorFog(200, 0.01) > getDynamicScreenSpaceErrorFog(100, 0.01),
    'fog strength increases with camera distance'
  ).toBeTruthy();
  expect(
    getDynamicScreenSpaceError(100, 0, 24),
    'zero effective density disables the reduction'
  ).toBe(0);
});
test('calculateDynamicScreenSpaceErrorDensity#local box responds to view and height', () => {
  const root = createTile({
    ...TILE_HEADER,
    boundingVolume: {box: [0, 0, 10, 10, 0, 0, 0, 10, 0, 0, 0, 10]}
  });
  expect(
    calculateDynamicScreenSpaceErrorDensity(
      root,
      createFrameState(),
      DYNAMIC_SCREEN_SPACE_ERROR_OPTIONS
    ),
    'a street-level horizontal view receives the full configured density'
  ).toBe(DYNAMIC_SCREEN_SPACE_ERROR_OPTIONS.dynamicScreenSpaceErrorDensity);
  expect(
    calculateDynamicScreenSpaceErrorDensity(
      root,
      createFrameState({camera: {direction: [0, 0, -1]}}),
      DYNAMIC_SCREEN_SPACE_ERROR_OPTIONS
    ),
    'a vertical view does not reduce refinement'
  ).toBe(0);
  expect(
    calculateDynamicScreenSpaceErrorDensity(
      root,
      createFrameState({camera: {position: [0, 0, 15]}}),
      DYNAMIC_SCREEN_SPACE_ERROR_OPTIONS
    ) < DYNAMIC_SCREEN_SPACE_ERROR_OPTIONS.dynamicScreenSpaceErrorDensity,
    'density fades as the camera rises through the tileset height range'
  ).toBeTruthy();
});
test('calculateDynamicScreenSpaceErrorDensity#uses the root transform without changing units', () => {
  const root = createTile({
    ...TILE_HEADER,
    transform: new Matrix4().translate([0, 0, 100]),
    boundingVolume: {sphere: [0, 0, 10, 10]}
  });
  const translatedFrameState = createFrameState({camera: {position: [0, 0, 105]}});
  expect(
    calculateDynamicScreenSpaceErrorDensity(
      root,
      translatedFrameState,
      DYNAMIC_SCREEN_SPACE_ERROR_OPTIONS
    ),
    'camera and source volume are compared in the same local coordinate system'
  ).toBe(DYNAMIC_SCREEN_SPACE_ERROR_OPTIONS.dynamicScreenSpaceErrorDensity);
});
test('dynamic screen-space error#refreshes an animated root before density calculation', () => {
  const root = createTile({
    ...TILE_HEADER,
    boundingVolume: {sphere: [0, 0, 10, 10]}
  });
  const currentModelMatrix = new Matrix4().translate([0, 0, 100]);
  updateRootTransformForDynamicScreenSpaceError(root, currentModelMatrix);
  expect(
    root.computedTransform.equals(currentModelMatrix),
    'uses the current-frame tileset transform before traversal'
  ).toBeTruthy();
  expect(root.lodMetricValue, 'does not compound the source geometric error').toBe(10);
  expect(
    calculateDynamicScreenSpaceErrorDensity(
      root,
      createFrameState({camera: {position: [0, 0, 105]}}),
      DYNAMIC_SCREEN_SPACE_ERROR_OPTIONS
    ),
    'calculates density from the refreshed transform in the same frame'
  ).toBe(DYNAMIC_SCREEN_SPACE_ERROR_OPTIONS.dynamicScreenSpaceErrorDensity);
});
test('calculateDynamicScreenSpaceErrorDensity#includes every oriented-box axis in height', () => {
  const halfAxesRoot = createTile({
    ...TILE_HEADER,
    boundingVolume: {box: [0, 0, 10, 10, 0, 10, 0, 2, 0, 0, 0, 1]}
  });
  const halfSizeQuaternionRoot = createTile({
    ...TILE_HEADER,
    boundingVolume: {
      box: [0, 0, 10, 10, 2, 1, 0, Math.sin(Math.PI / 4), 0, Math.cos(Math.PI / 4)]
    }
  });
  const frameState = createFrameState({camera: {position: [0, 0, 15]}});
  expect(
    calculateDynamicScreenSpaceErrorDensity(
      halfAxesRoot,
      frameState,
      DYNAMIC_SCREEN_SPACE_ERROR_OPTIONS
    ) > 0,
    'includes tilted half-axis z projections'
  ).toBeTruthy();
  expect(
    calculateDynamicScreenSpaceErrorDensity(
      halfSizeQuaternionRoot,
      frameState,
      DYNAMIC_SCREEN_SPACE_ERROR_OPTIONS
    ) > 0,
    'includes quaternion-rotated half-size z projections'
  ).toBeTruthy();
});
test('calculateDynamicScreenSpaceErrorDensity#uses geodetic region heights', () => {
  const root = createTile({
    ...TILE_HEADER,
    boundingVolume: {region: [-1, -1, 1, 1, 0, 100]}
  });
  const frameState = createFrameState({
    camera: {
      position: [Ellipsoid.WGS84.maximumRadius + 25, 0, 0],
      direction: [0, 1, 0],
      cartographicPosition: [0, 0, 25]
    }
  });
  expect(
    calculateDynamicScreenSpaceErrorDensity(root, frameState, DYNAMIC_SCREEN_SPACE_ERROR_OPTIONS),
    'region minimum and maximum heights control the falloff'
  ).toBe(DYNAMIC_SCREEN_SPACE_ERROR_OPTIONS.dynamicScreenSpaceErrorDensity);
});
test('getTiles3DScreenSpaceError#applies dynamic SSE only to perspective views', () => {
  const tile = createTile();
  tile.tileset.options.dynamicScreenSpaceError = true;
  const dynamicFrameState = createFrameState({dynamicScreenSpaceErrorDensity: 0.01});
  const expectedReduction = getDynamicScreenSpaceError(100, 0.01, 24);
  expect(
    getTiles3DScreenSpaceError(tile, dynamicFrameState, false),
    'subtracts the view-dependent reduction from perspective SSE'
  ).toBe(50 - expectedReduction);
  tile.tileset.options.dynamicScreenSpaceError = false;
  expect(
    getTiles3DScreenSpaceError(tile, dynamicFrameState, false),
    'the option restores the established perspective formula when disabled'
  ).toBe(50);
  tile.tileset.options.dynamicScreenSpaceError = true;
  expect(
    getTiles3DScreenSpaceError(
      tile,
      createFrameState({
        dynamicScreenSpaceErrorDensity: 0.01,
        viewport: {orthographic: true, metersPerPixel: 2}
      }),
      false
    ),
    'orthographic SSE is never reduced by the perspective optimization'
  ).toBe(5);
  expect(
    getTiles3DScreenSpaceError(
      tile,
      createFrameState({
        dynamicScreenSpaceErrorDensity: 0.01,
        viewport: {orthographic: true, metersPerPixel: 0}
      }),
      false
    ),
    'an invalid orthographic scale falls back without applying dynamic SSE'
  ).toBe(50);
});
