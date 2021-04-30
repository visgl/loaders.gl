const tiles = {};
const originalTileTextures = {};

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
  if (!uvDebugTexture || originalTileTextures[tile.id]) {
    return;
  }
  const {texture, material} = tile.content || {};
  if (material) {
    if (
      !(material && material.pbrMetallicRoughness && material.pbrMetallicRoughness.baseColorTexture)
    ) {
      return;
    }
    originalTileTextures[tile.id] =
      material.pbrMetallicRoughness.baseColorTexture.texture.source.image;
    material.pbrMetallicRoughness.baseColorTexture.texture.source.image = uvDebugTexture;
    tile.content.material = {...tile.content.material};
  } else if (texture) {
    originalTileTextures[tile.id] = texture;
    tile.content.texture = uvDebugTexture;
  }
}

export function selectOriginalTextureForTile(tile) {
  tiles[tile.id] = tile;
  const {texture, material} = tile.content || {};
  if (!originalTileTextures[tile.id]) {
    return;
  }
  if (material) {
    if (
      !(material && material.pbrMetallicRoughness && material.pbrMetallicRoughness.baseColorTexture)
    ) {
      return;
    }
    material.pbrMetallicRoughness.baseColorTexture.texture.source.image =
      originalTileTextures[tile.id];
    tile.content.material = {...tile.content.material};
  } else if (texture) {
    tile.content.texture = originalTileTextures[tile.id];
  }
  delete originalTileTextures[tile.id];
}
