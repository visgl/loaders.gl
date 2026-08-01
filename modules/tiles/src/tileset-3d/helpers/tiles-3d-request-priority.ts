// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

// This file contains behavior derived from the Cesium code base under Apache 2 license.

import {Vector3} from '@math.gl/core';
import {BoundingSphere, OrientedBoundingBox} from '@math.gl/culling';
import {TILE_REFINEMENT} from '../../constants';

const PREFERRED_SORTING_DIGITS = 10_000;
const FOVEATED_SORTING_SCALE = 10_000;
const PROGRESSIVE_RESOLUTION_PENALTY = 100_000_000;
const FOVEATED_DEFERRAL_PENALTY = 1_000_000_000;

const scratchBoundingSphere = new BoundingSphere();
const scratchCenterOffset = new Vector3();
const scratchClosestPointOnLine = new Vector3();
const scratchVectorToLine = new Vector3();
const scratchClosestPointOnSphere = new Vector3();

/** Interpolates a value used to relax SSE away from the center of the viewport. */
export type FoveatedInterpolationCallback = (
  minimumValue: number,
  maximumValue: number,
  interpolationAmount: number
) => number;

/** Camera measurements required to calculate a tile's foveated priority. */
export type FoveatedPriorityCamera = {
  /** Camera position in the same world-space coordinate system as the tile bounding volume. */
  position: number[];
  /** Normalized world-space camera direction. */
  direction: number[];
};

/** Inputs that determine whether a peripheral tile request may be deferred. */
export type FoveatedDeferralParameters = {
  /** Tile refinement mode. */
  refinement: TILE_REFINEMENT;
  /** Whether replacement traversal may skip hierarchy levels while retaining ancestors. */
  skipLevelOfDetail: boolean;
  /** Whether foveated prioritization is enabled. */
  foveatedScreenSpaceError: boolean;
  /** Fraction of the field of view that loads without foveated SSE relaxation. */
  foveatedConeSize: number;
  /** Minimum logical-pixel relaxation at the edge of the foveated cone. */
  minimumScreenSpaceErrorRelaxation: number;
  /** Interpolation function used to increase relaxation toward the viewport edge. */
  interpolationCallback: FoveatedInterpolationCallback;
  /** Tile distance from the camera view axis, represented as an angular factor. */
  foveatedFactor: number;
  /** Camera vertical field of view in radians. */
  verticalFieldOfView: number;
  /** Tile SSE in logical pixels. */
  screenSpaceError: number;
  /** Parent SSE in logical pixels, when a parent exists. */
  parentScreenSpaceError?: number;
  /** Current traversal SSE threshold in logical pixels. */
  maximumScreenSpaceError: number;
  /** Whether the tile contributes coarse progressive-resolution coverage. */
  priorityProgressiveResolution: boolean;
};

/** Inputs used to encode a stable, lexicographically ordered request priority. */
export type TileRequestPriorityParameters = {
  /** Whether the tile contributes coarse progressive-resolution coverage. */
  priorityProgressiveResolution: boolean;
  /** Whether the tile is eligible for moving-camera deferral. */
  priorityDeferred: boolean;
  /** Tile distance from the camera view axis, represented as an angular factor. */
  foveatedFactor: number;
  /** Existing reverse-SSE ordering value; smaller values are more urgent. */
  reverseScreenSpaceError: number;
  /** Root SSE used to normalize reverse-SSE ordering without changing its order. */
  rootScreenSpaceError: number;
};

/** Linearly interpolates between two values. */
export function interpolateLinearly(
  minimumValue: number,
  maximumValue: number,
  interpolationAmount: number
): number {
  return minimumValue + (maximumValue - minimumValue) * interpolationAmount;
}

/**
 * Calculates how far a tile lies from the camera's center line.
 *
 * The tile's bounding sphere, rather than only its center, is used so large tiles that intersect
 * the view axis retain center priority. The returned angular factor is zero on the view axis and
 * increases toward the edge of a perspective frustum.
 */
export function calculateFoveatedFactor(
  boundingVolume: BoundingSphere | OrientedBoundingBox,
  camera: FoveatedPriorityCamera
): number {
  const boundingSphere =
    boundingVolume instanceof BoundingSphere
      ? boundingVolume
      : boundingVolume.getBoundingSphere(scratchBoundingSphere);
  const {center, radius} = boundingSphere;

  scratchCenterOffset.copy(center).subtract(camera.position);
  const centerZDepth = scratchCenterOffset.dot(camera.direction);
  scratchClosestPointOnLine.copy(camera.direction).scale(centerZDepth).add(camera.position);
  scratchVectorToLine.copy(scratchClosestPointOnLine).subtract(center);

  const distanceToCenterLine = scratchVectorToLine.magnitude();
  if (distanceToCenterLine <= radius) {
    return 0;
  }

  scratchClosestPointOnSphere
    .copy(scratchVectorToLine)
    .normalize()
    .scale(radius)
    .add(center)
    .subtract(camera.position);
  if (scratchClosestPointOnSphere.magnitude() === 0) {
    return 0;
  }

  scratchClosestPointOnSphere.normalize();
  return Math.max(1 - Math.abs(scratchClosestPointOnSphere.dot(camera.direction)), 0);
}

/**
 * Returns whether a tile supplies the coarse coverage targeted by progressive resolution.
 *
 * In addition to tiles whose reduced-height SSE exceeds the normal threshold, the first child
 * that crosses below the threshold is promoted. Promoting that SSE leaf prevents gaps between
 * coarse hierarchy levels in the initial coverage pass.
 */
export function isProgressiveResolutionPriority(
  screenSpaceError: number,
  parentScreenSpaceError: number | undefined,
  maximumScreenSpaceError: number,
  progressiveResolutionHeightFraction: number
): boolean {
  if (
    !Number.isFinite(progressiveResolutionHeightFraction) ||
    progressiveResolutionHeightFraction <= 0 ||
    progressiveResolutionHeightFraction > 0.5
  ) {
    return false;
  }

  if (screenSpaceError > maximumScreenSpaceError) {
    return true;
  }

  return parentScreenSpaceError !== undefined && parentScreenSpaceError > maximumScreenSpaceError;
}

/**
 * Returns whether a peripheral request can wait briefly after camera motion.
 *
 * Traditional `REPLACE` traversal is never deferred because every required child must be ready
 * before its parent disappears. `ADD` traversal and skip-LOD replacement traversal can safely keep
 * already available ancestors while peripheral descendants wait.
 */
export function isFoveatedRequestDeferred(parameters: FoveatedDeferralParameters): boolean {
  const coneSize = Number.isFinite(parameters.foveatedConeSize)
    ? Math.min(Math.max(parameters.foveatedConeSize, 0), 1)
    : 1;
  const replacementRefinement = parameters.refinement === TILE_REFINEMENT.REPLACE;
  if (
    (replacementRefinement && !parameters.skipLevelOfDetail) ||
    !parameters.foveatedScreenSpaceError ||
    coneSize >= 1 ||
    (replacementRefinement &&
      parameters.skipLevelOfDetail &&
      parameters.priorityProgressiveResolution)
  ) {
    return false;
  }

  const verticalFieldOfView =
    Number.isFinite(parameters.verticalFieldOfView) && parameters.verticalFieldOfView > 0
      ? parameters.verticalFieldOfView
      : Math.PI / 3;
  const maximumFoveatedFactor = 1 - Math.cos(verticalFieldOfView * 0.5);
  const coneFactor = coneSize * maximumFoveatedFactor;
  if (parameters.foveatedFactor <= coneFactor || maximumFoveatedFactor <= coneFactor) {
    return false;
  }

  const interpolationAmount = Math.min(
    Math.max((parameters.foveatedFactor - coneFactor) / (maximumFoveatedFactor - coneFactor), 0),
    1
  );
  const interpolationCallback =
    typeof parameters.interpolationCallback === 'function'
      ? parameters.interpolationCallback
      : interpolateLinearly;
  const interpolatedRelaxation = interpolationCallback(
    parameters.minimumScreenSpaceErrorRelaxation,
    parameters.maximumScreenSpaceError,
    interpolationAmount
  );
  const screenSpaceErrorRelaxation = Number.isFinite(interpolatedRelaxation)
    ? Math.min(Math.max(interpolatedRelaxation, 0), parameters.maximumScreenSpaceError)
    : 0;
  const screenSpaceError =
    parameters.screenSpaceError === 0 && parameters.parentScreenSpaceError !== undefined
      ? parameters.parentScreenSpaceError * 0.5
      : parameters.screenSpaceError;

  return parameters.maximumScreenSpaceError - screenSpaceErrorRelaxation <= screenSpaceError;
}

/**
 * Encodes request priority into independent decimal bands.
 *
 * Smaller values load first. Moving-camera deferral is the strongest penalty, followed by the
 * progressive-coverage flag, distance from the view center, and finally the established reverse-
 * SSE order. Normalizing reverse SSE preserves its relative ordering while preventing one metric
 * from spilling into the next priority band.
 */
export function calculateTileRequestPriority(parameters: TileRequestPriorityParameters): number {
  const normalizedReverseScreenSpaceError =
    parameters.rootScreenSpaceError > 0
      ? Math.min(
          Math.max(parameters.reverseScreenSpaceError / parameters.rootScreenSpaceError, 0),
          1
        )
      : 0;
  const preferredSortingDigits = Math.floor(
    normalizedReverseScreenSpaceError * (PREFERRED_SORTING_DIGITS - 1)
  );
  const normalizedFoveatedFactor = Number.isFinite(parameters.foveatedFactor)
    ? Math.min(Math.max(parameters.foveatedFactor, 0), 1)
    : 0;
  const foveatedSortingDigits =
    Math.floor(normalizedFoveatedFactor * (PREFERRED_SORTING_DIGITS - 1)) * FOVEATED_SORTING_SCALE;
  const progressiveResolutionDigits = parameters.priorityProgressiveResolution
    ? 0
    : PROGRESSIVE_RESOLUTION_PENALTY;
  const foveatedDeferralDigits = parameters.priorityDeferred ? FOVEATED_DEFERRAL_PENALTY : 0;

  return (
    foveatedDeferralDigits +
    progressiveResolutionDigits +
    foveatedSortingDigits +
    preferredSortingDigits
  );
}
