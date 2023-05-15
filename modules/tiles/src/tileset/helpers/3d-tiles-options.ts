import type {TilesetJSON} from '../tileset-3d';

export function get3dTilesOptions(tileset: TilesetJSON): {assetGltfUpAxis: 'X' | 'Y' | 'Z'} {
  return {
    assetGltfUpAxis: (tileset?.asset?.gltfUpAxis) || 'Y'
  };
}
