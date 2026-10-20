// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

import {expect, test} from 'vitest';
import {BoundingSphere} from '@math.gl/culling';
import {TILE_CONTENT_STATE, TILE_REFINEMENT} from '../../src/constants';
import {Tile3D} from '../../src/tileset-3d/common/tile-3d';
import {TilesetTraverser} from '../../src/tileset-3d/common/tileset-traverser';
import {
  calculateFoveatedFactor,
  calculateTileRequestPriority,
  interpolateLinearly,
  isFoveatedRequestDelayActive,
  isFoveatedRequestDeferred,
  isProgressiveResolutionPriority
} from '../../src/tileset-3d/helpers/tiles-3d-request-priority';
const TEST_CAMERA = {
  position: [0, 0, 0],
  direction: [0, 0, 1]
};
test('request priority#foveated factor accounts for bounding volume', () => {
  const centeredTile = new BoundingSphere([0, 0, 10], 1);
  const peripheralTile = new BoundingSphere([5, 0, 10], 1);
  const intersectingTile = new BoundingSphere([4, 0, 10], 4);
  const behindCameraTile = new BoundingSphere([0, 0, -10], 1);
  expect(
    calculateFoveatedFactor(centeredTile, TEST_CAMERA),
    'centers a tile on the view axis'
  ).toBe(0);
  expect(
    calculateFoveatedFactor(peripheralTile, TEST_CAMERA) > 0,
    'assigns a positive angular factor to a peripheral tile'
  ).toBeTruthy();
  expect(
    calculateFoveatedFactor(intersectingTile, TEST_CAMERA),
    'keeps a large volume at center priority when it intersects the view axis'
  ).toBe(0);
  expect(
    calculateFoveatedFactor(behindCameraTile, TEST_CAMERA),
    'assigns maximum peripheral priority to a volume behind the camera'
  ).toBe(1);
});
test('request priority#progressive resolution promotes coverage and its SSE leaf', () => {
  expect(
    isProgressiveResolutionPriority(12, undefined, 8, 0.3),
    'promotes a tile above the reduced-height SSE threshold'
  ).toBeTruthy();
  expect(
    isProgressiveResolutionPriority(6, 12, 8, 0.3),
    'promotes the first child that crosses below the reduced-height threshold'
  ).toBeTruthy();
  expect(
    isProgressiveResolutionPriority(6, 7, 8, 0.3),
    'does not promote detail below the coarse coverage leaf'
  ).toBeFalsy();
  for (const invalidFraction of [0, -0.1, 0.6, Number.NaN]) {
    expect(
      isProgressiveResolutionPriority(12, undefined, 8, invalidFraction),
      `disables progressive priority for ${String(invalidFraction)}`
    ).toBeFalsy();
  }
});
test('request priority#foveated deferral preserves refinement continuity', () => {
  const deferralParameters = {
    refinement: TILE_REFINEMENT.ADD,
    skipLevelOfDetail: false,
    foveatedScreenSpaceError: true,
    foveatedConeSize: 0.1,
    minimumScreenSpaceErrorRelaxation: 0,
    interpolationCallback: interpolateLinearly,
    foveatedFactor: 1 - Math.cos(Math.PI / 6),
    verticalFieldOfView: Math.PI / 3,
    screenSpaceError: 8,
    maximumScreenSpaceError: 8,
    priorityProgressiveResolution: false
  };
  expect(
    isFoveatedRequestDeferred(deferralParameters),
    'defers eligible peripheral ADD content'
  ).toBeTruthy();
  expect(
    isFoveatedRequestDeferred({...deferralParameters, foveatedFactor: 0}),
    'does not defer content inside the center cone'
  ).toBeFalsy();
  expect(
    isFoveatedRequestDeferred({...deferralParameters, foveatedConeSize: Number.NaN}),
    'safely disables deferral for an invalid cone size'
  ).toBeFalsy();
  expect(
    isFoveatedRequestDeferred({
      ...deferralParameters,
      refinement: TILE_REFINEMENT.REPLACE
    }),
    'never defers traditional REPLACE children required to avoid holes'
  ).toBeFalsy();
  expect(
    isFoveatedRequestDeferred({
      ...deferralParameters,
      refinement: TILE_REFINEMENT.REPLACE,
      skipLevelOfDetail: true,
      priorityProgressiveResolution: true
    }),
    'does not defer progressive REPLACE coverage when skip LOD is enabled'
  ).toBeFalsy();
  expect(
    isFoveatedRequestDeferred({
      ...deferralParameters,
      refinement: TILE_REFINEMENT.REPLACE,
      skipLevelOfDetail: true
    }),
    'allows non-progressive REPLACE descendants to wait when an ancestor remains visible'
  ).toBeTruthy();
});
test('request priority#uses independent scheduling bands', () => {
  const basePriority = {
    priorityProgressiveResolution: false,
    foveatedFactor: 0,
    reverseScreenSpaceError: 0,
    rootScreenSpaceError: 100
  };
  const progressivePriority = calculateTileRequestPriority({
    ...basePriority,
    priorityProgressiveResolution: true,
    reverseScreenSpaceError: 100
  });
  const centerPriority = calculateTileRequestPriority(basePriority);
  const peripheralPriority = calculateTileRequestPriority({...basePriority, foveatedFactor: 0.1});
  expect(
    progressivePriority < centerPriority,
    'loads coarse progressive coverage first'
  ).toBeTruthy();
  expect(
    centerPriority < peripheralPriority,
    'loads viewport-center content before the periphery'
  ).toBeTruthy();
  expect(
    calculateTileRequestPriority({...basePriority, reverseScreenSpaceError: 10}) <
      calculateTileRequestPriority({...basePriority, reverseScreenSpaceError: 90}),
    'preserves reverse-SSE order inside the same priority band'
  ).toBeTruthy();
});
test('request priority#limits deferral to the active motion window', () => {
  expect(
    isFoveatedRequestDelayActive(true, 0.1, 0.2),
    'holds eligible work during the delay'
  ).toBeTruthy();
  expect(
    isFoveatedRequestDelayActive(true, 0.2, 0.2),
    'removes the hold when the delay expires'
  ).toBeFalsy();
  expect(
    isFoveatedRequestDelayActive(false, 0.1, 0.2),
    'does not hold refinement-ineligible work'
  ).toBeFalsy();
  for (const invalidDelay of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    expect(
      isFoveatedRequestDelayActive(true, 0.1, invalidDelay),
      `disables the hold for delay ${String(invalidDelay)}`
    ).toBeFalsy();
  }
});
test('Tile3D#scheduler callback cancels a request that became deferred while queued', () => {
  const tile = Object.assign(Object.create(Tile3D.prototype), {
    refine: TILE_REFINEMENT.ADD,
    tileset: {
      _frameNumber: 1,
      _traverser: {
        options: {skipLevelOfDetail: false},
        root: {_screenSpaceError: 100}
      }
    },
    parent: null,
    _visible: true,
    _touchedFrame: 1,
    _screenSpaceError: 10,
    _priorityProgressiveResolution: false,
    _foveatedFactor: 0.1,
    contentState: TILE_CONTENT_STATE.LOADING,
    priorityDeferred: true
  }) as Tile3D;
  expect(tile._getPriority(), 'cancels the queued scheduler entry during motion').toBe(-1);
  tile.priorityDeferred = false;
  expect(tile._getPriority() >= 0, 'restores normal priority after the delay expires').toBeTruthy();
});
test('TilesetTraverser#releases deferred requests after the movement delay', () => {
  const traverser = new TilesetTraverser({});
  const tile = {
    id: 'peripheral-tile',
    priorityDeferred: true,
    tileset: {options: {foveatedTimeDelay: 0.2}},
    hasUnloadedContent: true,
    contentExpired: false,
    _requestedFrame: 0,
    _priority: 0,
    _getPriority: () => 4
  };
  const movingFrameState = {
    frameNumber: 1,
    camera: {timeSinceMovement: 0.1}
  };
  // @ts-expect-error test supplies the minimal tile and frame-state fields used by loadTile
  traverser.loadTile(tile, movingFrameState);
  expect(
    traverser.deferredTiles[tile.id],
    'holds the request while the camera is moving'
  ).toBeTruthy();
  expect(traverser.requestedTiles[tile.id], 'does not issue the held request').toBeFalsy();
  traverser.reset();
  tile.priorityDeferred = isFoveatedRequestDelayActive(true, 0.2, 0.2);
  // @ts-expect-error test supplies the minimal tile and frame-state fields used by loadTile
  traverser.loadTile(tile, {...movingFrameState, camera: {timeSinceMovement: 0.2}});
  expect(
    traverser.requestedTiles[tile.id],
    'releases the request when the delay expires'
  ).toBeTruthy();
  expect(tile._priority, 'calculates normal request priority after release').toBe(4);
});
