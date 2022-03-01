import {Vector3} from '@math.gl/core';
import {BoundingSphere, OrientedBoundingBox} from '@math.gl/culling';
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

function getObbSize(halfAxes) {
  halfAxes.getColumn(0, scratchVector);
  const axeY = halfAxes.getColumn(1);
  const axeZ = halfAxes.getColumn(2);
  const farthestVertex = scratchVector.add(axeY).add(axeZ);
  const size = farthestVertex.len();
  return size;
}
