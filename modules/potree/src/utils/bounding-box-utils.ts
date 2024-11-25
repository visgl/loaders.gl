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
  const [minXOriginal, minYOriginal, minZ] = boundingBox[0];
  const [maxXOriginal, maxYOriginal, maxZ] = boundingBox[1];
  let minX = minXOriginal;
  let minY = minYOriginal;
  let maxX = maxXOriginal;
  let maxY = maxYOriginal;
  if (projection) {
    [minX, minY] = projection.project([minX, minY]);
    [maxX, maxY] = projection.project([maxX, maxY]);
  }
  return [minX + (maxX - minX) / 2, minY + (maxY - minY) / 2, minZ + (maxZ - minZ) / 2];
};
