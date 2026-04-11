import {Proj4Projection} from '@math.gl/proj4';

/**
 * Calculate cartographic origin from Potree bounding box
 * @param projection - Proj4Projection instance to reproject coordinates
 * @param boundingBox - bounding box data
 * @returns - origin of boudngin box in [lng, lat, z] mode
 */
export const getCartographicOriginFromBoundingBox = (
  projection: Proj4Projection | null,
  boundingBox?: [number[], number[]]
): number[] => {
  if (!boundingBox) {
    return [0, 0, 0];
  }

  const [nativeX, nativeY, nativeZ] = getNativeOriginFromBoundingBox(boundingBox);
  let projectedX = nativeX;
  let projectedY = nativeY;
  if (projection) {
    [projectedX, projectedY] = projection.project([nativeX, nativeY]);
  }
  return [projectedX, projectedY, nativeZ];
};

/**
 * Calculate native point-cloud origin from a bounding box.
 * @param boundingBox - bounding box data in source coordinates
 * @returns - origin in source coordinate space
 */
export const getNativeOriginFromBoundingBox = (
  boundingBox?: [number[], number[]]
): [number, number, number] => {
  if (!boundingBox) {
    return [0, 0, 0];
  }

  const [minBounds, maxBounds] = boundingBox;
  return [
    minBounds[0] + (maxBounds[0] - minBounds[0]) / 2,
    minBounds[1] + (maxBounds[1] - minBounds[1]) / 2,
    minBounds[2] + (maxBounds[2] - minBounds[2]) / 2
  ];
};
