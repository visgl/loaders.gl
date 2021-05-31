export function get3dTilesOptions(tileset) {
  return {
    assetGltfUpAxis: (tileset.asset && tileset.asset.gltfUpAxis) || 'Y'
  };
}
