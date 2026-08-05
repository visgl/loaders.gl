// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

// This file tests behavior derived from the Cesium code base under Apache 2 license.

import test from 'test/utils/vitest-tape';
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

test('request priority#foveated factor accounts for bounding volume', t => {
  const centeredTile = new BoundingSphere([0, 0, 10], 1);
  const peripheralTile = new BoundingSphere([5, 0, 10], 1);
  const intersectingTile = new BoundingSphere([4, 0, 10], 4);
  const behindCameraTile = new BoundingSphere([0, 0, -10], 1);

  t.equals(
    calculateFoveatedFactor(centeredTile, TEST_CAMERA),
    0,
    'centers a tile on the view axis'
  );
  t.ok(
    calculateFoveatedFactor(peripheralTile, TEST_CAMERA) > 0,
    'assigns a positive angular factor to a peripheral tile'
  );
  t.equals(
    calculateFoveatedFactor(intersectingTile, TEST_CAMERA),
    0,
    'keeps a large volume at center priority when it intersects the view axis'
  );
  t.equals(
    calculateFoveatedFactor(behindCameraTile, TEST_CAMERA),
    1,
    'assigns maximum peripheral priority to a volume behind the camera'
  );
  t.end();
});

test('request priority#progressive resolution promotes coverage and its SSE leaf', t => {
  t.ok(
    isProgressiveResolutionPriority(12, undefined, 8, 0.3),
    'promotes a tile above the reduced-height SSE threshold'
  );
  t.ok(
    isProgressiveResolutionPriority(6, 12, 8, 0.3),
    'promotes the first child that crosses below the reduced-height threshold'
  );
  t.notOk(
    isProgressiveResolutionPriority(6, 7, 8, 0.3),
    'does not promote detail below the coarse coverage leaf'
  );
  for (const invalidFraction of [0, -0.1, 0.6, Number.NaN]) {
    t.notOk(
      isProgressiveResolutionPriority(12, undefined, 8, invalidFraction),
      `disables progressive priority for ${String(invalidFraction)}`
    );
  }
  t.end();
});

test('request priority#foveated deferral preserves refinement continuity', t => {
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

  t.ok(isFoveatedRequestDeferred(deferralParameters), 'defers eligible peripheral ADD content');
  t.notOk(
    isFoveatedRequestDeferred({...deferralParameters, foveatedFactor: 0}),
    'does not defer content inside the center cone'
  );
  t.notOk(
    isFoveatedRequestDeferred({...deferralParameters, foveatedConeSize: Number.NaN}),
    'safely disables deferral for an invalid cone size'
  );
  t.notOk(
    isFoveatedRequestDeferred({
      ...deferralParameters,
      refinement: TILE_REFINEMENT.REPLACE
    }),
    'never defers traditional REPLACE children required to avoid holes'
  );
  t.notOk(
    isFoveatedRequestDeferred({
      ...deferralParameters,
      refinement: TILE_REFINEMENT.REPLACE,
      skipLevelOfDetail: true,
      priorityProgressiveResolution: true
    }),
    'does not defer progressive REPLACE coverage when skip LOD is enabled'
  );
  t.ok(
    isFoveatedRequestDeferred({
      ...deferralParameters,
      refinement: TILE_REFINEMENT.REPLACE,
      skipLevelOfDetail: true
    }),
    'allows non-progressive REPLACE descendants to wait when an ancestor remains visible'
  );
  t.end();
});

test('request priority#uses independent scheduling bands', t => {
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

  t.ok(progressivePriority < centerPriority, 'loads coarse progressive coverage first');
  t.ok(centerPriority < peripheralPriority, 'loads viewport-center content before the periphery');
  t.ok(
    calculateTileRequestPriority({...basePriority, reverseScreenSpaceError: 10}) <
      calculateTileRequestPriority({...basePriority, reverseScreenSpaceError: 90}),
    'preserves reverse-SSE order inside the same priority band'
  );
  t.end();
});

test('request priority#limits deferral to the active motion window', t => {
  t.ok(isFoveatedRequestDelayActive(true, 0.1, 0.2), 'holds eligible work during the delay');
  t.notOk(isFoveatedRequestDelayActive(true, 0.2, 0.2), 'removes the hold when the delay expires');
  t.notOk(
    isFoveatedRequestDelayActive(false, 0.1, 0.2),
    'does not hold refinement-ineligible work'
  );
  for (const invalidDelay of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    t.notOk(
      isFoveatedRequestDelayActive(true, 0.1, invalidDelay),
      `disables the hold for delay ${String(invalidDelay)}`
    );
  }
  t.end();
});

test('Tile3D#scheduler callback cancels a request that became deferred while queued', t => {
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

  t.equals(tile._getPriority(), -1, 'cancels the queued scheduler entry during motion');
  tile.priorityDeferred = false;
  t.ok(tile._getPriority() >= 0, 'restores normal priority after the delay expires');
  t.end();
});

test('TilesetTraverser#releases deferred requests after the movement delay', t => {
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
  t.ok(traverser.deferredTiles[tile.id], 'holds the request while the camera is moving');
  t.notOk(traverser.requestedTiles[tile.id], 'does not issue the held request');

  traverser.reset();
  tile.priorityDeferred = isFoveatedRequestDelayActive(true, 0.2, 0.2);
  // @ts-expect-error test supplies the minimal tile and frame-state fields used by loadTile
  traverser.loadTile(tile, {...movingFrameState, camera: {timeSinceMovement: 0.2}});
  t.ok(traverser.requestedTiles[tile.id], 'releases the request when the delay expires');
  t.equals(tile._priority, 4, 'calculates normal request priority after release');
  t.end();
});
