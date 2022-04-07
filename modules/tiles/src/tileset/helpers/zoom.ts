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
  const extentVertex = Ellipsoid.WGS84.cartographicToCartesian(
    [fullExtent.xmax, fullExtent.ymax, fullExtent.zmax],
    new Vector3()
  );
  const extentSize = Math.sqrt(
    Math.pow(extentVertex[0] - cartesianCenter[0], 2) +
      Math.pow(extentVertex[1] - cartesianCenter[1], 2) +
      Math.pow(extentVertex[2] - cartesianCenter[2], 2)
  );
  return Math.log2(WGS84_RADIUS_Z / (extentSize + cartorgraphicCenter[2]));
}

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
