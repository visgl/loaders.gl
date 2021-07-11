// The tiles list in the tileset mutates continually.
// We need to store tiles when we replace texture
const tiles = {};

export function selectDebugTextureForTileset(tileset, uvDebugTexture) {
  if (!uvDebugTexture) {
    return;
  }
  for (const tile of tileset.tiles) {
    selectDebugTextureForTile(tile, uvDebugTexture);
  }
  for (const tileId in tiles) {
    selectDebugTextureForTile(tiles[tileId], uvDebugTexture);
  }
}

export function selectOriginalTextureForTileset(tileset) {
  for (const tileId in tiles) {
    selectOriginalTextureForTile(tiles[tileId]);
  }
}

export function selectDebugTextureForTile(tile, uvDebugTexture) {
  tiles[tile.id] = tile;
  if (!uvDebugTexture || tile.userData.originalTexture) {
    return;
  }
  const {texture, material} = tile.content || {};
  if (material) {
    if (
      !(material && material.pbrMetallicRoughness && material.pbrMetallicRoughness.baseColorTexture)
    ) {
      return;
    }
    tile.userData.originalTexture =
      material.pbrMetallicRoughness.baseColorTexture.texture.source.image;
    material.pbrMetallicRoughness.baseColorTexture.texture.source.image = uvDebugTexture;
    tile.content.material = {...tile.content.material};
  } else if (texture) {
    tile.userData.originalTexture = texture;
    tile.content.texture = uvDebugTexture;
  }
}

export function selectOriginalTextureForTile(tile) {
  tiles[tile.id] = tile;
  const {
    content,
    userData: {originalTexture}
  } = tile;
  const {texture, material} = content || {};
  if (!originalTexture) {
    return;
  }
  if (material) {
    if (
      !(material && material.pbrMetallicRoughness && material.pbrMetallicRoughness.baseColorTexture)
    ) {
      return;
    }
    material.pbrMetallicRoughness.baseColorTexture.texture.source.image = originalTexture;
    tile.content.material = {...tile.content.material};
  } else if (texture) {
    tile.content.texture = originalTexture;
  }
  delete tile.userData.originalTexture;
}
