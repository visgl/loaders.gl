import type {Tileset3D} from '../common/tileset-3d';

export function get3dTilesOptions(tileset: Tileset3D): {assetGltfUpAxis: 'X' | 'Y' | 'Z'} {
  return {
    assetGltfUpAxis: (tileset.asset && tileset.asset.gltfUpAxis) || 'Y'
  };
}
