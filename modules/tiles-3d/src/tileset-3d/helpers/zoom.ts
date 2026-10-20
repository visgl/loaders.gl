// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Vector3} from '@math.gl/core';
import {BoundingSphere, OrientedBoundingBox} from '@math.gl/culling';
import {Ellipsoid} from '@math.gl/geospatial';
import {BoundingRectangle} from '../../types';

const WGS84_RADIUS_X = 6378137.0;
const WGS84_RADIUS_Y = 6378137.0;
const WGS84_RADIUS_Z = 6356752.3142451793;

const scratchVector = new Vector3();

/**
 * Calculate appropriate zoom value for a particular boundingVolume
 * @param boundingVolume - the instance of bounding volume
 * @param cartorgraphicCenter - cartographic center of the bounding volume
 * @returns {number} - zoom value
 */
export function getZoomFromBoundingVolume(
  boundingVolume: BoundingSphere | OrientedBoundingBox | BoundingRectangle,
  cartorgraphicCenter: Vector3
) {
  if (boundingVolume instanceof OrientedBoundingBox) {
    // OrientedBoundingBox
    const {halfAxes} = boundingVolume;
    const obbSize = getObbSize(halfAxes);
    // Use WGS84_RADIUS_Z to allign with BoundingSphere algorithm
    // Add the tile elevation value for correct zooming to elevated tiles
    return Math.log2(WGS84_RADIUS_Z / (obbSize + cartorgraphicCenter[2]));
  } else if (boundingVolume instanceof BoundingSphere) {
    // BoundingSphere
    const {radius} = boundingVolume;
    // Add the tile elevation value for correct zooming to elevated tiles
    return Math.log2(WGS84_RADIUS_Z / (radius + cartorgraphicCenter[2]));
  } else if (boundingVolume.width && boundingVolume.height) {
    // BoundingRectangle
    const {width, height} = boundingVolume;
    const zoomX = Math.log2(WGS84_RADIUS_X / width);
    const zoomY = Math.log2(WGS84_RADIUS_Y / height);

    return (zoomX + zoomY) / 2;
  }

  return 1;
}

/**
 * Calculate initial zoom for the tileset from 3D `fullExtent` defined in
 * the tileset metadata
 * @param fullExtent - 3D extent of the tileset
 * @param fullExtent.xmin - minimal longitude in decimal degrees
 * @param fullExtent.xmax - maximal longitude in decimal degrees
 * @param fullExtent.ymin - minimal latitude in decimal degrees
 * @param fullExtent.ymax - maximal latitude in decimal degrees
 * @param fullExtent.zmin - minimal elevation in meters
 * @param fullExtent.zmax - maximal elevation in meters
 * @param cartorgraphicCenter - tileset center in cartographic coordinate system
 * @param cartesianCenter - tileset center in cartesian coordinate system
 * @returns - initial zoom for the tileset
 */
export function getZoomFromFullExtent(
  fullExtent: {
    xmin: number;
    xmax: number;
    ymin: number;
    ymax: number;
    zmin: number;
    zmax: number;
  },
  cartorgraphicCenter: Vector3,
  cartesianCenter: Vector3
) {
  Ellipsoid.WGS84.cartographicToCartesian(
    [fullExtent.xmax, fullExtent.ymax, fullExtent.zmax],
    scratchVector
  );
  const extentSize = Math.sqrt(
    Math.pow(scratchVector[0] - cartesianCenter[0], 2) +
      Math.pow(scratchVector[1] - cartesianCenter[1], 2) +
      Math.pow(scratchVector[2] - cartesianCenter[2], 2)
  );
  return Math.log2(WGS84_RADIUS_Z / (extentSize + cartorgraphicCenter[2]));
}

/**
 * Calculate initial zoom for the tileset from 2D `extent` defined in
 * the tileset metadata
 * @param extent - 2D extent of the tileset. It is array of 4 elements [xmin, ymin, xmax, ymax]
 * @param extent[0] - minimal longitude in decimal degrees
 * @param extent[1] - minimal latitude in decimal degrees
 * @param extent[2] - maximal longitude in decimal degrees
 * @param extent[3] - maximal latitude in decimal degrees
 * @param cartorgraphicCenter - tileset center in cartographic coordinate system
 * @param cartesianCenter - tileset center in cartesian coordinate system
 * @returns - initial zoom for the tileset
 */
export function getZoomFromExtent(
  extent: [number, number, number, number],
  cartorgraphicCenter: Vector3,
  cartesianCenter: Vector3
) {
  const [xmin, ymin, xmax, ymax] = extent;
  return getZoomFromFullExtent(
    {xmin, xmax, ymin, ymax, zmin: 0, zmax: 0},
    cartorgraphicCenter,
    cartesianCenter
  );
}

function getObbSize(halfAxes) {
  halfAxes.getColumn(0, scratchVector);
  const axeY = halfAxes.getColumn(1);
  const axeZ = halfAxes.getColumn(2);
  const farthestVertex = scratchVector.add(axeY).add(axeZ);
  const size = farthestVertex.len();
  return size;
}
