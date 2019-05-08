"use strict";module.export({parse3DTileGLTFViewSync:()=>parse3DTileGLTFViewSync});function parse3DTileGLTFViewSync(tile, arrayBuffer, byteOffset) {
  // Assume glTF consumes rest of tile
  const gltfByteLength = tile.byteOffset + tile.byteLength - byteOffset;
  if (gltfByteLength === 0) {
    throw new Error('glTF byte length must be greater than 0.');
  }

  if (byteOffset % 4 === 0) {
    tile.gltfView = new Uint8Array(arrayBuffer, byteOffset, gltfByteLength);
  } else {
    // Create a copy of the glb so that it is 4-byte aligned
    // eslint-disable-next-line
    console.warn(`${tile.type}: embedded glb is not aligned to a 4-byte boundary.`);
    const uint8Array = new Uint8Array(arrayBuffer);
    tile.gltfView = new Uint8Array(uint8Array.subarray(byteOffset, byteOffset + gltfByteLength));
  }

  // Entire tile is consumed
  return tile.byteOffset + tile.byteLength;
}
