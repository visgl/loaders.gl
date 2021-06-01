import {Vector3} from '@math.gl/core';

const WGS84_RADIUS_X = 6378137.0;
const WGS84_RADIUS_Y = 6378137.0;
const WGS84_RADIUS_Z = 6356752.3142451793;

const scratchVector = new Vector3();

/**
 * Calculate appropriate zoom value for a particular boundingVolume
 * @param {BoundingSphere, OrientedBoundingBox} boundingVolume - the instance of bounding volume
 * @returns {number} - zoom value
 */
export function getZoomFromBoundingVolume(boundingVolume) {
  const {halfAxes, radius, width, height} = boundingVolume;

  if (halfAxes) {
    // OrientedBoundingBox
    const obbSize = getObbSize(halfAxes);
    // Use WGS84_RADIUS_Z to allign with BoundingSphere algorithm
    return Math.log2(WGS84_RADIUS_Z / obbSize);
  } else if (radius) {
    // BoundingSphere
    return Math.log2(WGS84_RADIUS_Z / radius);
  } else if (height && width) {
    // BoundingRectangle
    const zoomX = Math.log2(WGS84_RADIUS_X / width);
    const zoomY = Math.log2(WGS84_RADIUS_Y / height);

    return (zoomX + zoomY) / 2;
  }

  return 1;
}

function getObbSize(halfAxes) {
  halfAxes.getColumn(0, scratchVector);
  const axeY = halfAxes.getColumn(1);
  const axeZ = halfAxes.getColumn(2);
  const farthestVertex = scratchVector.add(axeY).add(axeZ);
  const size = farthestVertex.len();
  return size;
}
