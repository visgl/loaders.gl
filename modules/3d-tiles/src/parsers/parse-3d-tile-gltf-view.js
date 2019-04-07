export function parse3DTileGLTFView(tile, arrayBuffer, byteOffset, byteStart) {
  const {byteLength} = tile;
  const gltfByteLength = byteStart + byteLength - byteOffset;
  if (gltfByteLength === 0) {
    throw new Error('glTF byte length must be greater than 0.');
  }

  if (byteOffset % 4 === 0) {
    tile.gltfView = new Uint8Array(arrayBuffer, byteOffset, gltfByteLength);
  } else {
    // Create a copy of the glb so that it is 4-byte aligned
    console.warn(`${tile.type}: embedded glb is not aligned to a 4-byte boundary.`); // eslint-disable-line
    tile.gltfView = new Uint8Array(uint8Array.subarray(byteOffset, byteOffset + gltfByteLength));
  }

  return byteStart + byteOffset;
}
