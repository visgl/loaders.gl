// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Tile3D} from '../common/tile-3d';
import {Vector3} from '@math.gl/core';
import {CullingVolume, Plane} from '@math.gl/culling';
import {Ellipsoid} from '@math.gl/geospatial';
import {GeospatialViewport, Viewport} from '../../types';

export type FrameState = {
  camera: {
    /** Camera position in WGS84 Cartesian meters. */
    position: number[];
    /** Normalized camera direction in WGS84 Cartesian coordinates. */
    direction: number[];
    /** Normalized camera up direction in WGS84 Cartesian coordinates. */
    up: number[];
    /** Camera position as `[longitude, latitude, height]`, with height in meters. */
    cartographicPosition: [number, number, number];
    /** Perspective vertical field of view in radians. */
    verticalFieldOfView: number;
    /** Elapsed seconds since camera position or direction last changed. */
    timeSinceMovement: number;
  };
  viewport: GeospatialViewport;
  topDownViewport: GeospatialViewport; // Use it to calculate projected radius for a tile
  height: number;
  cullingVolume: CullingVolume;
  /** Optional world-space clipping planes applied to render-content culling. */
  clippingPlanes?: Plane[];
  frameNumber: number; // TODO: This can be the same between updates, what number is unique for between updates?
  sseDenominator: number; // Assumes fovy = 60 degrees
  /** View-dependent density used by perspective dynamic screen-space error for this traversal. */
  dynamicScreenSpaceErrorDensity: number;
};

/** Optional camera and projection measurements supplied when constructing a frame state. */
export type GetFrameStateOptions = {
  /** Elapsed seconds since camera position or direction last changed. */
  timeSinceCameraMovement?: number;
};

/** Camera pose and timestamp retained between traversal frames. */
export type CameraMotionState = {
  /** Last observed Earth-centered, Earth-fixed camera position. */
  position: number[];
  /** Last observed normalized Earth-centered, Earth-fixed camera direction. */
  direction: number[];
  /** Timestamp in milliseconds of the last observed pose change. */
  lastMovementTime: number;
};

/** Updated camera state and elapsed stationary time for a traversal frame. */
export type CameraMotionUpdate = {
  /** Camera pose to retain for the next traversal. */
  state: CameraMotionState;
  /** Elapsed seconds since the camera pose last changed. */
  timeSinceMovement: number;
};

const scratchVector = new Vector3();
const scratchPosition = new Vector3();
const CAMERA_POSITION_EPSILON = 1e-5;
const CAMERA_DIRECTION_EPSILON = 1e-7;
const cullingVolume = new CullingVolume([
  new Plane(),
  new Plane(),
  new Plane(),
  new Plane(),
  new Plane(),
  new Plane()
]);

/**
 * Extracts a frame state appropriate for tile culling from a structural deck.gl viewport.
 *
 * `options.timeSinceCameraMovement` can be supplied by a caller that retains camera pose across
 * calls. It defaults to a stationary camera so standalone callers do not defer requests.
 *
 * @param viewport - Geospatial viewport supplying camera and projection measurements.
 * @param frameNumber - Current tileset traversal frame number.
 * @param options - Additional camera and projection measurements for traversal.
 * @returns Frame state used for visibility, SSE, and request-priority calculations.
 */
export function getFrameState(
  viewport: GeospatialViewport,
  frameNumber: number,
  options: GetFrameStateOptions = {}
): FrameState {
  // Traverse and and request. Update _selectedTiles so that we know what to render.
  // Traverse and and request. Update _selectedTiles so that we know what to render.
  const {cameraUp, height} = viewport;
  const cameraDirection = viewport.cameraDirection as number[] | undefined;
  const {metersPerUnit} = viewport.distanceScales;

  // TODO - Ellipsoid.eastNorthUpToFixedFrame() breaks on raw array, create a Vector.
  // TODO - Ellipsoid.eastNorthUpToFixedFrame() takes a cartesian, is that intuitive?
  const viewportCenterCartesian = worldToCartesian(viewport, viewport.center);
  const enuToFixedTransform = Ellipsoid.WGS84.eastNorthUpToFixedFrame(viewportCenterCartesian);

  const cameraPositionCartographic = viewport.unprojectPosition(viewport.cameraPosition);
  const cameraPositionCartesian = Ellipsoid.WGS84.cartographicToCartesian(
    cameraPositionCartographic,
    new Vector3()
  );

  // These should still be normalized as the transform has scale 1 (goes from meters to meters)
  let cameraDirectionCartesian: Vector3;
  if (cameraDirection) {
    cameraDirectionCartesian = new Vector3(
      // @ts-ignore
      enuToFixedTransform.transformAsVector(new Vector3(cameraDirection).scale(metersPerUnit))
    ).normalize();
  } else {
    // Concrete deck.gl viewports do not expose the legacy structural cameraDirection field.
    // The near-plane center is on the view axis, so its world-space direction is equivalent and
    // works for perspective foveation without coupling loaders.gl to deck.gl internals.
    // getFrustumPlanes is required by traversal but omitted from the minimal structural Viewport
    // type for compatibility with existing application-side declarations.
    // @ts-expect-error Runtime geospatial viewports provide getFrustumPlanes.
    const nearPlane = viewport.getFrustumPlanes().near;
    const nearCenterCommon = closestPointOnPlane(nearPlane, viewport.cameraPosition);
    const nearCenterCartesian = worldToCartesian(viewport, nearCenterCommon);
    cameraDirectionCartesian = new Vector3(nearCenterCartesian)
      .subtract(cameraPositionCartesian)
      .normalize();
  }
  const cameraUpCartesian = new Vector3(
    // @ts-ignore
    enuToFixedTransform.transformAsVector(new Vector3(cameraUp).scale(metersPerUnit))
  ).normalize();

  commonSpacePlanesToWGS84(viewport);

  const ViewportClass = viewport.constructor;
  const {longitude, latitude, width, bearing, zoom} = viewport;
  // @ts-ignore
  const topDownViewport = new ViewportClass({
    longitude,
    latitude,
    height,
    width,
    bearing,
    zoom,
    pitch: 0
  });

  // TODO: make a file/class for frameState and document what needs to be attached to this so that traversal can function
  return {
    camera: {
      position: cameraPositionCartesian,
      direction: cameraDirectionCartesian,
      up: cameraUpCartesian,
      cartographicPosition: cameraPositionCartographic,
      verticalFieldOfView:
        Number.isFinite(viewport.fovy) && Number(viewport.fovy) > 0
          ? (Number(viewport.fovy) * Math.PI) / 180
          : Math.PI / 3,
      timeSinceMovement: options.timeSinceCameraMovement ?? Number.POSITIVE_INFINITY
    },
    viewport,
    topDownViewport,
    height,
    cullingVolume,
    frameNumber, // TODO: This can be the same between updates, what number is unique for between updates?
    sseDenominator: 1.15, // Assumes fovy = 60 degrees
    // Tileset3D fills this immediately before traversal because it depends on the root volume.
    dynamicScreenSpaceErrorDensity: 0
  };
}

/**
 * Updates retained camera motion state and calculates how long the current pose has been stable.
 *
 * The first observation is treated as stationary so initial tileset loading is never delayed.
 * Position and direction are both compared because orbiting in place changes request relevance
 * without necessarily changing the viewport's camera position.
 *
 * @param previousState - Pose retained from the preceding traversal for this viewport.
 * @param position - Current Earth-centered, Earth-fixed camera position.
 * @param direction - Current normalized Earth-centered, Earth-fixed camera direction.
 * @param currentTime - Current monotonic-enough wall-clock time in milliseconds.
 * @returns Updated pose and elapsed stationary time.
 */
export function updateCameraMotionState(
  previousState: CameraMotionState | undefined,
  position: number[] | Vector3,
  direction: number[] | Vector3,
  currentTime: number
): CameraMotionUpdate {
  const positionArray = Array.from(position);
  const directionArray = Array.from(direction);
  const positionChanged = previousState
    ? positionArray.length !== previousState.position.length ||
      positionArray.some(
        (value, index) => Math.abs(value - previousState.position[index]) > CAMERA_POSITION_EPSILON
      )
    : false;
  const directionChanged = previousState
    ? directionArray.length !== previousState.direction.length ||
      directionArray.some(
        (value, index) =>
          Math.abs(value - previousState.direction[index]) > CAMERA_DIRECTION_EPSILON
      )
    : false;
  const lastMovementTime =
    positionChanged || directionChanged
      ? currentTime
      : (previousState?.lastMovementTime ?? Number.NEGATIVE_INFINITY);

  return {
    state: {
      position: positionArray,
      direction: directionArray,
      lastMovementTime
    },
    timeSinceMovement: Math.max((currentTime - lastMovementTime) / 1000, 0)
  };
}

/**
 * Limit `tiles` array length with `maximumTilesSelected` number.
 * The criteria for this filtering is distance of a tile center
 * to the `frameState.viewport`'s longitude and latitude
 * @param tiles - tiles array to filter
 * @param frameState - frameState to calculate distances
 * @param maximumTilesSelected - maximal amount of tiles in the output array
 * @returns new tiles array
 */
export function limitSelectedTiles(
  tiles: Tile3D[],
  frameState: FrameState,
  maximumTilesSelected: number
): [Tile3D[], Tile3D[]] {
  if (maximumTilesSelected === 0 || tiles.length <= maximumTilesSelected) {
    return [tiles, []];
  }
  // Accumulate distances in couples array: [tileIndex: number, distanceToViewport: number]
  const tuples: [number, number][] = [];
  const {longitude: viewportLongitude, latitude: viewportLatitude} = frameState.viewport;
  for (const [index, tile] of tiles.entries()) {
    const [longitude, latitude] = tile.header.mbs;
    const deltaLon = Math.abs(viewportLongitude - longitude);
    const deltaLat = Math.abs(viewportLatitude - latitude);
    const distance = Math.sqrt(deltaLat * deltaLat + deltaLon * deltaLon);
    tuples.push([index, distance]);
  }
  const tuplesSorted = tuples.sort((a, b) => a[1] - b[1]);
  const selectedTiles: Tile3D[] = [];
  for (let i = 0; i < maximumTilesSelected; i++) {
    selectedTiles.push(tiles[tuplesSorted[i][0]]);
  }
  const unselectedTiles: Tile3D[] = [];
  for (let i = maximumTilesSelected; i < tuplesSorted.length; i++) {
    unselectedTiles.push(tiles[tuplesSorted[i][0]]);
  }

  return [selectedTiles, unselectedTiles];
}

function commonSpacePlanesToWGS84(viewport) {
  // Extract frustum planes based on current view.
  const frustumPlanes = viewport.getFrustumPlanes();

  // Get the near/far plane centers
  const nearCenterCommon = closestPointOnPlane(frustumPlanes.near, viewport.cameraPosition);
  const nearCenterCartesian = worldToCartesian(viewport, nearCenterCommon);
  const cameraCartesian = worldToCartesian(viewport, viewport.cameraPosition, scratchPosition);

  let i = 0;
  cullingVolume.planes[i++].fromPointNormal(
    nearCenterCartesian,
    scratchVector.copy(nearCenterCartesian).subtract(cameraCartesian)
  );

  for (const dir in frustumPlanes) {
    if (dir === 'near') {
      continue; // eslint-disable-line no-continue
    }
    const plane = frustumPlanes[dir];
    const posCommon = closestPointOnPlane(plane, nearCenterCommon, scratchPosition);
    const cartesianPos = worldToCartesian(viewport, posCommon, scratchPosition);

    cullingVolume.planes[i++].fromPointNormal(
      cartesianPos,
      // Want the normal to point into the frustum since that's what culling expects
      scratchVector.copy(nearCenterCartesian).subtract(cartesianPos)
    );
  }
}

function closestPointOnPlane(
  plane: {distance: number; normal: Vector3},
  refPoint: number[] | Vector3,
  out: Vector3 = new Vector3()
): Vector3 {
  const distanceToRef = plane.normal.dot(refPoint);
  out
    .copy(plane.normal)
    .scale(plane.distance - distanceToRef)
    .add(refPoint);
  return out;
}

function worldToCartesian(
  viewport: Viewport,
  point: number[] | Vector3,
  out: Vector3 = new Vector3()
): Vector3 {
  const cartographicPos = viewport.unprojectPosition(point);
  return Ellipsoid.WGS84.cartographicToCartesian(cartographicPos, out);
}
