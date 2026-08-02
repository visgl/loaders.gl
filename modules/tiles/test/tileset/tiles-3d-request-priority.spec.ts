// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

// This file tests behavior derived from the Cesium code base under Apache 2 license.

import test from 'tape-promise/tape';
import {BoundingSphere} from '@math.gl/culling';
import {TILE_REFINEMENT} from '../../src/constants';
import {TilesetTraverser} from '../../src/tileset-3d/common/tileset-traverser';
import {
  calculateFoveatedFactor,
  calculateTileRequestPriority,
  interpolateLinearly,
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
    priorityDeferred: false,
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
  const deferredPriority = calculateTileRequestPriority({
    ...basePriority,
    priorityDeferred: true
  });

  t.ok(progressivePriority < centerPriority, 'loads coarse progressive coverage first');
  t.ok(centerPriority < peripheralPriority, 'loads viewport-center content before the periphery');
  t.ok(peripheralPriority < deferredPriority, 'keeps deferred content behind stationary work');
  t.ok(
    calculateTileRequestPriority({...basePriority, reverseScreenSpaceError: 10}) <
      calculateTileRequestPriority({...basePriority, reverseScreenSpaceError: 90}),
    'preserves reverse-SSE order inside the same priority band'
  );
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
  // @ts-expect-error test supplies the minimal tile and frame-state fields used by loadTile
  traverser.loadTile(tile, {...movingFrameState, camera: {timeSinceMovement: 0.2}});
  t.ok(traverser.requestedTiles[tile.id], 'releases the request when the delay expires');
  t.equals(tile._priority, 4, 'calculates normal request priority after release');
  t.end();
});
