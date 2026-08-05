// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

// This file tests behavior derived from the Cesium code base under Apache 2 license.

import test from 'test/utils/vitest-tape';
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

test('getTiles3DScreenSpaceError#preserves perspective calculation', t => {
  const tile = createTile();
  t.equals(
    getTiles3DScreenSpaceError(tile, createFrameState(), false),
    50,
    'projects geometric error using viewport height, distance, and denominator'
  );
  t.end();
});

test('getTiles3DScreenSpaceError#scales progressive-resolution perspective height', t => {
  const tile = createTile();
  t.equals(
    getTiles3DScreenSpaceError(tile, createFrameState(), false, 0.3),
    15,
    'calculates coarse-pass SSE at 30% of logical viewport height'
  );
  t.end();
});

test('getTiles3DScreenSpaceError#composes progressive and dynamic perspective SSE', t => {
  const tile = createTile();
  tile.tileset.options.dynamicScreenSpaceError = true;
  const frameState = createFrameState({dynamicScreenSpaceErrorDensity: 0.01});
  const expectedReduction = getDynamicScreenSpaceError(100, 0.01, 24);

  t.equals(
    getTiles3DScreenSpaceError(tile, frameState, false, 0.3),
    15 - expectedReduction,
    'scales the projection term before applying the unchanged dynamic SSE reduction'
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

test('getTiles3DScreenSpaceError#scales progressive-resolution orthographic pixels', t => {
  const tile = createTile();
  t.equals(
    getTiles3DScreenSpaceError(
      tile,
      createFrameState({viewport: {orthographic: true, metersPerPixel: 2}}),
      false,
      0.3
    ),
    1.5,
    'represents the same tile in a reduced-height logical-pixel pass'
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

test('dynamic screen-space error#uses exponential fog', t => {
  t.equals(getDynamicScreenSpaceErrorFog(0, 0.01), 0, 'zero distance has no fog');
  t.ok(
    getDynamicScreenSpaceErrorFog(200, 0.01) > getDynamicScreenSpaceErrorFog(100, 0.01),
    'fog strength increases with camera distance'
  );
  t.equals(
    getDynamicScreenSpaceError(100, 0, 24),
    0,
    'zero effective density disables the reduction'
  );
  t.end();
});

test('calculateDynamicScreenSpaceErrorDensity#local box responds to view and height', t => {
  const root = createTile({
    ...TILE_HEADER,
    boundingVolume: {box: [0, 0, 10, 10, 0, 0, 0, 10, 0, 0, 0, 10]}
  });

  t.equals(
    calculateDynamicScreenSpaceErrorDensity(
      root,
      createFrameState(),
      DYNAMIC_SCREEN_SPACE_ERROR_OPTIONS
    ),
    DYNAMIC_SCREEN_SPACE_ERROR_OPTIONS.dynamicScreenSpaceErrorDensity,
    'a street-level horizontal view receives the full configured density'
  );
  t.equals(
    calculateDynamicScreenSpaceErrorDensity(
      root,
      createFrameState({camera: {direction: [0, 0, -1]}}),
      DYNAMIC_SCREEN_SPACE_ERROR_OPTIONS
    ),
    0,
    'a vertical view does not reduce refinement'
  );
  t.ok(
    calculateDynamicScreenSpaceErrorDensity(
      root,
      createFrameState({camera: {position: [0, 0, 15]}}),
      DYNAMIC_SCREEN_SPACE_ERROR_OPTIONS
    ) < DYNAMIC_SCREEN_SPACE_ERROR_OPTIONS.dynamicScreenSpaceErrorDensity,
    'density fades as the camera rises through the tileset height range'
  );
  t.end();
});

test('calculateDynamicScreenSpaceErrorDensity#uses the root transform without changing units', t => {
  const root = createTile({
    ...TILE_HEADER,
    transform: new Matrix4().translate([0, 0, 100]),
    boundingVolume: {sphere: [0, 0, 10, 10]}
  });
  const translatedFrameState = createFrameState({camera: {position: [0, 0, 105]}});

  t.equals(
    calculateDynamicScreenSpaceErrorDensity(
      root,
      translatedFrameState,
      DYNAMIC_SCREEN_SPACE_ERROR_OPTIONS
    ),
    DYNAMIC_SCREEN_SPACE_ERROR_OPTIONS.dynamicScreenSpaceErrorDensity,
    'camera and source volume are compared in the same local coordinate system'
  );
  t.end();
});

test('dynamic screen-space error#refreshes an animated root before density calculation', t => {
  const root = createTile({
    ...TILE_HEADER,
    boundingVolume: {sphere: [0, 0, 10, 10]}
  });
  const currentModelMatrix = new Matrix4().translate([0, 0, 100]);

  updateRootTransformForDynamicScreenSpaceError(root, currentModelMatrix);

  t.ok(
    root.computedTransform.equals(currentModelMatrix),
    'uses the current-frame tileset transform before traversal'
  );
  t.equals(root.lodMetricValue, 10, 'does not compound the source geometric error');
  t.equals(
    calculateDynamicScreenSpaceErrorDensity(
      root,
      createFrameState({camera: {position: [0, 0, 105]}}),
      DYNAMIC_SCREEN_SPACE_ERROR_OPTIONS
    ),
    DYNAMIC_SCREEN_SPACE_ERROR_OPTIONS.dynamicScreenSpaceErrorDensity,
    'calculates density from the refreshed transform in the same frame'
  );
  t.end();
});

test('calculateDynamicScreenSpaceErrorDensity#includes every oriented-box axis in height', t => {
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

  t.ok(
    calculateDynamicScreenSpaceErrorDensity(
      halfAxesRoot,
      frameState,
      DYNAMIC_SCREEN_SPACE_ERROR_OPTIONS
    ) > 0,
    'includes tilted half-axis z projections'
  );
  t.ok(
    calculateDynamicScreenSpaceErrorDensity(
      halfSizeQuaternionRoot,
      frameState,
      DYNAMIC_SCREEN_SPACE_ERROR_OPTIONS
    ) > 0,
    'includes quaternion-rotated half-size z projections'
  );
  t.end();
});

test('calculateDynamicScreenSpaceErrorDensity#uses geodetic region heights', t => {
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

  t.equals(
    calculateDynamicScreenSpaceErrorDensity(root, frameState, DYNAMIC_SCREEN_SPACE_ERROR_OPTIONS),
    DYNAMIC_SCREEN_SPACE_ERROR_OPTIONS.dynamicScreenSpaceErrorDensity,
    'region minimum and maximum heights control the falloff'
  );
  t.end();
});

test('getTiles3DScreenSpaceError#applies dynamic SSE only to perspective views', t => {
  const tile = createTile();
  tile.tileset.options.dynamicScreenSpaceError = true;
  const dynamicFrameState = createFrameState({dynamicScreenSpaceErrorDensity: 0.01});
  const expectedReduction = getDynamicScreenSpaceError(100, 0.01, 24);

  t.equals(
    getTiles3DScreenSpaceError(tile, dynamicFrameState, false),
    50 - expectedReduction,
    'subtracts the view-dependent reduction from perspective SSE'
  );

  tile.tileset.options.dynamicScreenSpaceError = false;
  t.equals(
    getTiles3DScreenSpaceError(tile, dynamicFrameState, false),
    50,
    'the option restores the established perspective formula when disabled'
  );

  tile.tileset.options.dynamicScreenSpaceError = true;
  t.equals(
    getTiles3DScreenSpaceError(
      tile,
      createFrameState({
        dynamicScreenSpaceErrorDensity: 0.01,
        viewport: {orthographic: true, metersPerPixel: 2}
      }),
      false
    ),
    5,
    'orthographic SSE is never reduced by the perspective optimization'
  );
  t.equals(
    getTiles3DScreenSpaceError(
      tile,
      createFrameState({
        dynamicScreenSpaceErrorDensity: 0.01,
        viewport: {orthographic: true, metersPerPixel: 0}
      }),
      false
    ),
    50,
    'an invalid orthographic scale falls back without applying dynamic SSE'
  );
  t.end();
});
