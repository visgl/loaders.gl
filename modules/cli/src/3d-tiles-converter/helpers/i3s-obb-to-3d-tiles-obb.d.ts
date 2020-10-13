/**
 * Convert quaternion-based OBB to half-axes-based OBB
 * @param i3SObb quaternion based OBB
 * @returns number[12] 3DTiles OBB https://github.com/CesiumGS/3d-tiles/tree/master/specification#box
 */
export function i3sObbTo3dTilesObb(i3SObb: {
  center: number[];
  halfSize: number[];
  quaternion: number[];
}): number[];
