export function getMeshSize(attributes) {
  let size = 0;
  for (const attributeName in attributes) {
    const attribute = attributes[attributeName];
    if (ArrayBuffer.isView(attribute)) {
      // @ts-ignore DataView doesn't have BYTES_PER_ELEMENT
      size += attribute.byteLength * attribute.BYTES_PER_ELEMENT;
    }
  }
  return size;
}

// eslint-disable-next-line complexity
export function getMeshBoundingBox(attributes) {
  if (!attributes || !attributes.POSITION) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  const positions = attributes.POSITION.value;
  const len = positions && positions.length;

  if (!len) {
    return null;
  }

  for (let i = 0; i < len; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    minX = x < minX ? x : minX;
    minY = y < minY ? y : minY;
    minZ = z < minZ ? z : minZ;

    maxX = x > maxX ? x : maxX;
    maxY = y > maxY ? y : maxY;
    maxZ = z > maxZ ? z : maxZ;
  }
  return [[minX, minY, minZ], [maxX, maxY, maxZ]];
}
