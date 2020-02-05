// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

// TODO - Dynamic screen space error provides an optimization when looking at
// tilesets from above

/* eslint-disable */
import {Matrix4, Vector3, clamp} from '@math.gl/core';

const scratchPositionNormal = new Vector3();
const scratchCartographic = new Cartographic();
const scratchMatrix = new Matrix4();
const scratchCenter = new Vector3();
const scratchPosition = new Vector3();
const scratchDirection = new Vector3();

// eslint-disable-next-line max-statements, complexity
export function calculateDynamicScreenSpaceError(root, {camera, mapProjection}, options = {}) {
  const {
    dynamicScreenSpaceErrorHeightFalloff = 0.25,
    dynamicScreenSpaceErrorDensity = 0.00278
  } = options;

  let up;
  let direction;
  let height;
  let minimumHeight;
  let maximumHeight;

  const tileBoundingVolume = root.contentBoundingVolume;

  if (tileBoundingVolume instanceof TileBoundingRegion) {
    up = Cartesian3.normalize(camera.positionWC, scratchPositionNormal);
    direction = camera.directionWC;
    height = camera.positionCartographic.height;
    minimumHeight = tileBoundingVolume.minimumHeight;
    maximumHeight = tileBoundingVolume.maximumHeight;
  } else {
    // Transform camera position and direction into the local coordinate system of the tileset
    const transformLocal = Matrix4.inverseTransformation(root.computedTransform, scratchMatrix);
    const ellipsoid = mapProjection.ellipsoid;
    const boundingVolume = tileBoundingVolume.boundingVolume;
    const centerLocal = Matrix4.multiplyByPoint(
      transformLocal,
      boundingVolume.center,
      scratchCenter
    );
    if (Cartesian3.magnitude(centerLocal) > ellipsoid.minimumRadius) {
      // The tileset is defined in WGS84. Approximate the minimum and maximum height.
      const centerCartographic = Cartographic.fromCartesian(
        centerLocal,
        ellipsoid,
        scratchCartographic
      );
      up = Cartesian3.normalize(camera.positionWC, scratchPositionNormal);
      direction = camera.directionWC;
      height = camera.positionCartographic.height;
      minimumHeight = 0.0;
      maximumHeight = centerCartographic.height * 2.0;
    } else {
      // The tileset is defined in local coordinates (z-up)
      const positionLocal = Matrix4.multiplyByPoint(
        transformLocal,
        camera.positionWC,
        scratchPosition
      );
      up = Cartesian3.UNIT_Z;
      direction = Matrix4.multiplyByPointAsVector(
        transformLocal,
        camera.directionWC,
        scratchDirection
      );
      direction = Cartesian3.normalize(direction, direction);
      height = positionLocal.z;
      if (tileBoundingVolume instanceof TileOrientedBoundingBox) {
        // Assuming z-up, the last component stores the half-height of the box
        const boxHeight = root._header.boundingVolume.box[11];
        minimumHeight = centerLocal.z - boxHeight;
        maximumHeight = centerLocal.z + boxHeight;
      } else if (tileBoundingVolume instanceof TileBoundingSphere) {
        const radius = boundingVolume.radius;
        minimumHeight = centerLocal.z - radius;
        maximumHeight = centerLocal.z + radius;
      }
    }
  }

  // The range where the density starts to lessen. Start at the quarter height of the tileset.
  const heightFalloff = dynamicScreenSpaceErrorHeightFalloff;
  const heightClose = minimumHeight + (maximumHeight - minimumHeight) * heightFalloff;
  const heightFar = maximumHeight;

  const t = clamp((height - heightClose) / (heightFar - heightClose), 0.0, 1.0);

  // Increase density as the camera tilts towards the horizon
  const dot = Math.abs(Cartesian3.dot(direction, up));

  let horizonFactor = 1.0 - dot;

  // Weaken the horizon factor as the camera height increases, implying the camera is further away from the tileset.
  // The goal is to increase density for the "street view", not when viewing the tileset from a distance.
  horizonFactor = horizonFactor * (1.0 - t);

  return dynamicScreenSpaceErrorDensity * horizonFactor;
}
