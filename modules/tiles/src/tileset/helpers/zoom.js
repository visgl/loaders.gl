import {Vector3} from '@math.gl/core';

const WGS84_RADIUS_X = 6378137.0;
const WGS84_RADIUS_Y = 6378137.0;
const WGS84_RADIUS_Z = 6356752.3142451793;

const scratchVector = new Vector3();

export function getZoomFromBoundingVolume(boundingVolume) {
  const {halfAxes, radius, width, height} = boundingVolume;

  if (halfAxes) {
    // OrientedBoundingBox
    halfAxes.getColumn(0, scratchVector);
    const x = scratchVector.len();
    halfAxes.getColumn(1, scratchVector);
    const y = scratchVector.len();
    halfAxes.getColumn(2, scratchVector);
    const z = scratchVector.len();

    const halfX = x / 2;
    const halfY = y / 2;
    const halfZ = z / 2;

    const zoomX = Math.log2(WGS84_RADIUS_X / halfX);
    const zoomY = Math.log2(WGS84_RADIUS_Y / halfY);
    const zoomZ = Math.log2(WGS84_RADIUS_Z / halfZ);
    return (zoomX + zoomY + zoomZ) / 3;
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
