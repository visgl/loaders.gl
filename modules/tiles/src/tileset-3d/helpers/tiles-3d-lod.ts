// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {Matrix4, Vector3, clamp} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import type {Tile3D} from '../common/tile-3d';
import type {FrameState} from './frame-state';

/** Options that control the perspective dynamic screen-space error optimization. */
export type DynamicScreenSpaceErrorOptions = {
  /** Base fog density used to reduce distant, horizon-facing screen-space error. */
  dynamicScreenSpaceErrorDensity: number;
  /** Maximum number of logical pixels subtracted from perspective screen-space error. */
  dynamicScreenSpaceErrorFactor: number;
  /** Fraction of the tileset height at which the optimization begins to fade. */
  dynamicScreenSpaceErrorHeightFalloff: number;
};

type TileBoundingVolumeHeader = {
  box?: number[];
  region?: number[];
  sphere?: number[];
};

type TilesetHeightRange = {
  cameraHeight: number;
  minimumHeight: number;
  maximumHeight: number;
  cameraDirection: Vector3;
  upDirection: Vector3;
};

const scratchPositionNormal = new Vector3();
const scratchCartographic = new Vector3();
const scratchCenter = new Vector3();
const scratchPosition = new Vector3();
const scratchDirection = new Vector3();
const unitZDirection = new Vector3(0, 0, 1);

/**
 * Calculates the effective dynamic screen-space error density for one viewport and frame.
 *
 * Dynamic SSE is a perspective-only optimization for street-level views. It reduces refinement
 * for distant tiles near the horizon, where loading every geometric detail is expensive and has
 * limited visual benefit. Density fades to zero as the camera rises above the tileset or points
 * vertically. The returned value belongs to the supplied frame state; callers must not reuse it
 * for another viewport because camera height and direction are view dependent.
 *
 * @param root - Root tile whose transform and source bounding volume define the tileset space.
 * @param frameState - Current camera measurements in WGS84 and logical viewport space.
 * @param options - Dynamic SSE density and height-falloff controls.
 * @returns Effective fog density for this viewport, or zero when it cannot be calculated.
 */
export function calculateDynamicScreenSpaceErrorDensity(
  root: Tile3D,
  frameState: FrameState,
  options: DynamicScreenSpaceErrorOptions
): number {
  if (
    !Number.isFinite(options.dynamicScreenSpaceErrorDensity) ||
    options.dynamicScreenSpaceErrorDensity <= 0
  ) {
    return 0;
  }

  const boundingVolumeHeader = getContentBoundingVolumeHeader(root);
  const heightRange = boundingVolumeHeader.region
    ? getRegionHeightRange(boundingVolumeHeader.region, frameState)
    : getCartesianHeightRange(root, boundingVolumeHeader, frameState);

  if (!heightRange) {
    return 0;
  }

  const heightFalloff = clamp(options.dynamicScreenSpaceErrorHeightFalloff, 0, 1);
  const heightClose =
    heightRange.minimumHeight +
    (heightRange.maximumHeight - heightRange.minimumHeight) * heightFalloff;
  const heightSpan = heightRange.maximumHeight - heightClose;
  const heightPercentage =
    heightSpan > 0
      ? clamp((heightRange.cameraHeight - heightClose) / heightSpan, 0, 1)
      : heightRange.cameraHeight >= heightRange.maximumHeight
        ? 1
        : 0;

  // A horizontal view has a dot product near zero and receives the strongest optimization.
  // A vertical view has a dot product near one and keeps the unmodified perspective SSE.
  const verticalAlignment = clamp(
    Math.abs(heightRange.cameraDirection.dot(heightRange.upDirection)),
    0,
    1
  );
  const horizonFactor = (1 - verticalAlignment) * (1 - heightPercentage);

  return options.dynamicScreenSpaceErrorDensity * horizonFactor;
}

/**
 * Calculates exponential fog strength for a camera distance and density.
 * @param distanceToCamera - Distance from the camera to the tile bounding volume in meters.
 * @param density - Effective dynamic SSE density in inverse meters.
 * @returns Unitless strength in the inclusive range from zero to one.
 */
export function getDynamicScreenSpaceErrorFog(distanceToCamera: number, density: number): number {
  const scalar = distanceToCamera * density;
  return 1 - Math.exp(-(scalar * scalar));
}

/**
 * Calculates the perspective SSE reduction for a tile.
 * @param distanceToCamera - Distance from the camera to the tile bounding volume in meters.
 * @param density - View-dependent fog density calculated for the current frame.
 * @param factor - Maximum reduction in logical/CSS pixels.
 * @returns Number of logical pixels to subtract from perspective SSE.
 */
export function getDynamicScreenSpaceError(
  distanceToCamera: number,
  density: number,
  factor: number
): number {
  if (density <= 0 || factor <= 0 || !Number.isFinite(density) || !Number.isFinite(factor)) {
    return 0;
  }

  return getDynamicScreenSpaceErrorFog(distanceToCamera, density) * factor;
}

/**
 * Calculates 3D Tiles screen-space error (SSE) for the current projection.
 *
 * Perspective SSE projects the tile's world-space geometric error through the existing viewport
 * height and frustum denominator. Dynamic SSE may then reduce distant horizon refinement using
 * the density calculated specifically for this frame and viewport. Orthographic projection has
 * no perspective distance falloff, so its error is divided directly by the viewport's world-space
 * meters per logical pixel and is never adjusted by perspective dynamic SSE.
 *
 * @param tile - Tile containing the transform-scaled geometric error and camera distance.
 * @param frameState - Current camera and viewport measurements.
 * @param useParentLodMetric - Whether request prioritization should use the parent's error.
 * @param viewportHeightFraction - Fraction of viewport height represented by the priority pass.
 * @returns Estimated error in logical/CSS pixels.
 */
export function getTiles3DScreenSpaceError(
  tile: Tile3D,
  frameState: FrameState,
  useParentLodMetric: boolean,
  viewportHeightFraction = 1
): number {
  const tileset = tile.tileset;
  const parentLodMetricValue = (tile.parent && tile.parent.lodMetricValue) || tile.lodMetricValue;
  const lodMetricValue = useParentLodMetric ? parentLodMetricValue : tile.lodMetricValue;

  // Leaf tiles do not have any error so save the computation.
  if (lodMetricValue === 0) {
    return 0;
  }

  const {viewDistanceScale} = tileset.options;
  const lodScale = viewDistanceScale || 1;
  const heightFraction = Number.isFinite(viewportHeightFraction)
    ? Math.max(viewportHeightFraction, 0)
    : 1;
  const orthographicError = getOrthographicScreenSpaceError(
    lodMetricValue,
    frameState,
    lodScale,
    heightFraction
  );
  if (orthographicError !== null) {
    return orthographicError;
  }

  // Avoid divide by zero when viewer is inside the tile.
  const distanceToCamera = Math.max(tile._distanceToCamera, 1e-7);
  const {height, sseDenominator} = frameState;
  let screenSpaceError =
    (lodMetricValue * height * heightFraction * lodScale) /
    (distanceToCamera * sseDenominator);

  if (tileset.options.dynamicScreenSpaceError && !frameState.viewport.orthographic) {
    screenSpaceError -= getDynamicScreenSpaceError(
      distanceToCamera,
      frameState.dynamicScreenSpaceErrorDensity,
      tileset.options.dynamicScreenSpaceErrorFactor
    );
  }

  return screenSpaceError;
}

/**
 * Calculates orthographic SSE when the viewport provides a valid logical-pixel scale.
 *
 * deck.gl viewport dimensions and `metersPerPixel` use logical/CSS pixels. Applying the browser's
 * device pixel ratio again would therefore double-correct the result and select different LODs on
 * otherwise identical displays. If a structural third-party viewport does not expose a usable
 * scale, `null` tells the caller to retain the established perspective-compatible fallback.
 *
 * @param lodMetricValue - Transform-scaled geometric error in world-space meters.
 * @param frameState - Current frame state containing the viewport.
 * @param lodScale - Application refinement scale from `viewDistanceScale`.
 * @param viewportHeightFraction - Fraction of logical viewport height represented by the pass.
 * @returns SSE in logical pixels, or `null` when orthographic SSE cannot be calculated.
 */
function getOrthographicScreenSpaceError(
  lodMetricValue: number,
  frameState: FrameState,
  lodScale: number,
  viewportHeightFraction: number
): number | null {
  const viewport = frameState.viewport;
  if (!viewport?.orthographic) {
    return null;
  }

  const metersPerPixel = viewport.metersPerPixel;
  if (!Number.isFinite(metersPerPixel) || !metersPerPixel || metersPerPixel <= 0) {
    return null;
  }

  return (lodMetricValue * lodScale * viewportHeightFraction) / metersPerPixel;
}

/** Returns the content bounding volume header, falling back to the traversal volume. */
function getContentBoundingVolumeHeader(root: Tile3D): TileBoundingVolumeHeader {
  return root.header.content?.boundingVolume || root.header.boundingVolume;
}

/** Calculates camera and tileset heights for a geodetic region bounding volume. */
function getRegionHeightRange(region: number[], frameState: FrameState): TilesetHeightRange {
  const upDirection = scratchPositionNormal.copy(frameState.camera.position).normalize();
  const cameraDirection = scratchDirection.copy(frameState.camera.direction).normalize();

  return {
    cameraHeight: frameState.camera.cartographicPosition[2],
    minimumHeight: region[4],
    maximumHeight: region[5],
    cameraDirection,
    upDirection
  };
}

/**
 * Calculates camera and tileset heights for box and sphere volumes.
 *
 * The root transform is inverted so that both camera height and source volume dimensions use the
 * same coordinate system. Small coordinates are treated as local z-up. Earth-scale coordinates
 * are treated as WGS84 and use cartographic height, matching Cesium's conservative approximation.
 */
function getCartesianHeightRange(
  root: Tile3D,
  boundingVolumeHeader: TileBoundingVolumeHeader,
  frameState: FrameState
): TilesetHeightRange | null {
  const halfHeight = getBoundingVolumeCenterAndHalfHeight(boundingVolumeHeader, scratchCenter);
  if (halfHeight === null) {
    return null;
  }

  const localTransform = new Matrix4(root.computedTransform).invert();
  const ellipsoid = root.tileset.ellipsoid as Ellipsoid;
  const centerMagnitude = Math.hypot(scratchCenter[0], scratchCenter[1], scratchCenter[2]);

  if (centerMagnitude > ellipsoid.minimumRadius) {
    const centerCartographic = ellipsoid.cartesianToCartographic(
      scratchCenter,
      scratchCartographic
    );
    const upDirection = scratchPositionNormal.copy(frameState.camera.position).normalize();
    const cameraDirection = scratchDirection.copy(frameState.camera.direction).normalize();

    return {
      cameraHeight: frameState.camera.cartographicPosition[2],
      minimumHeight: 0,
      maximumHeight: centerCartographic[2] * 2,
      cameraDirection,
      upDirection
    };
  }

  localTransform.transformAsPoint(frameState.camera.position, scratchPosition);
  localTransform.transformAsVector(frameState.camera.direction, scratchDirection);
  scratchDirection.normalize();

  return {
    cameraHeight: scratchPosition[2],
    minimumHeight: scratchCenter[2] - halfHeight,
    maximumHeight: scratchCenter[2] + halfHeight,
    cameraDirection: scratchDirection,
    upDirection: unitZDirection
  };
}

/**
 * Copies the source volume center and returns its conservative z-up half-height.
 * @param boundingVolumeHeader - Root content or traversal volume from tileset JSON.
 * @param result - Scratch vector that receives the source-space center.
 * @returns Half-height in source-space meters, or `null` for an unsupported volume.
 */
function getBoundingVolumeCenterAndHalfHeight(
  boundingVolumeHeader: TileBoundingVolumeHeader,
  result: Vector3
): number | null {
  if (boundingVolumeHeader.box) {
    const box = boundingVolumeHeader.box;
    result.set(box[0], box[1], box[2]);
    return box.length === 10 ? box[5] : Math.hypot(box[9], box[10], box[11]);
  }

  if (boundingVolumeHeader.sphere) {
    const sphere = boundingVolumeHeader.sphere;
    result.set(sphere[0], sphere[1], sphere[2]);
    return sphere[3];
  }

  return null;
}
