// TODO Find out what else we can show to user in debug mode.
export function getTileDebugInfo(tileheader) {
  return {
    TILE_ID: tileheader.id,
    LOD_METRIC_VALUE: tileheader.lodMetricValue,
    TYPE: tileheader.type,
    BOUNDING_TYPE: tileheader.boundingVolume.constructor.name,
    CHILDREN_COUNT: tileheader.header.children ? tileheader.header.children.length : 0,
    DISTANCE_TO_CAMERA: tileheader._distanceToCamera,
    VERTEX_COUNT: tileheader.content.vertexCount,
    HAS_TEXTURE: Boolean(tileheader.content.texture),
    HAS_MATERIAL: Boolean(tileheader.content.material)
  };
}
