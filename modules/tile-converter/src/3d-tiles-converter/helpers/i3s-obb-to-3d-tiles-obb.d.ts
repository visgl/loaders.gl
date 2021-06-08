import {GeoidHeightModel} from '@loaders.gl/tile-converter/lib/geoid-height-model';

/**
 * Convert quaternion-based OBB to half-axes-based OBB
 * @param i3SObb quaternion based OBB
 * @param geoidHeightModel the Earth Gravity Model instance
 * @returns number[12] 3DTiles OBB https://github.com/CesiumGS/3d-tiles/tree/master/specification#box
 */
export function i3sObbTo3dTilesObb(
  i3SObb: {
    center: number[];
    halfSize: number[];
    quaternion: number[];
  },
  geoidHeightModel: GeoidHeightModel
): number[];
