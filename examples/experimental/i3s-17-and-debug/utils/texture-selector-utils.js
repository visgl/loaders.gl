export function selectDebugTextureForTileset(tileset, uvDebugTexture) {
  if (!uvDebugTexture) {
    return;
  }
  for (const tile of tileset.tiles) {
    selectDebugTextureForTile(tile, uvDebugTexture);
  }
}

export function selectOriginalTextureForTileset(tileset) {
  for (const tile of tileset.tiles) {
    selectOriginalTextureForTile(tile);
  }
}

export function selectDebugTextureForTile(tile, uvDebugTexture) {
  if (!uvDebugTexture) {
    return;
  }
  const {texture, material} = tile.content || {};
  if (material) {
    if (
      !(material && material.pbrMetallicRoughness && material.pbrMetallicRoughness.baseColorTexture)
    ) {
      return;
    }
    tile.content.originalTexture =
      material.pbrMetallicRoughness.baseColorTexture.texture.source.image;
    material.pbrMetallicRoughness.baseColorTexture.texture.source.image = uvDebugTexture;
    tile.content.material = {...tile.content.material};
  } else if (texture) {
    tile.content.originalTexture = texture;
    tile.content.texture = uvDebugTexture;
  }
}

export function selectOriginalTextureForTile(tile) {
  const {texture, material, originalTexture} = tile.content || {};
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
}
