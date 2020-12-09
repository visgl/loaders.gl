export function getI3SOptions(tileset) {
  const geometryBuffers =
    (tileset &&
      tileset.geometryDefinitions &&
      tileset.geometryDefinitions[0] &&
      tileset.geometryDefinitions[0].geometryBuffers) ||
    [];
  const dracoGeometryIndex = geometryBuffers.findIndex(
    buffer => buffer.compressedAttributes && buffer.compressedAttributes.encoding === 'draco'
  );
  return {
    dracoGeometryIndex
  };
}
