// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

/* global TextDecoder */

// TODO - should we automatically parse the embedded glTF or leave it to the app?
// - I.e. some apps might work directly on a GLB, in that case no need for us to decode...
// - And if we decode, do we still keep the GLB in case it is needed?
// - Do we add an option to control this?
// - Also, should we have hard dependency on gltf module or use injection or auto-discovery for gltf parser?
//
// import {parseGLTFSync} from '@loaders.gl/gltf';

export const GLTF_FORMAT = {
  URI: 0,
  EMBEDDED: 1
};

export function parse3DTileGLTFViewSync(tile, arrayBuffer, byteOffset) {
  // Assume glTF consumes rest of tile
  const gltfByteLength = tile.byteOffset + tile.byteLength - byteOffset;
  if (gltfByteLength === 0) {
    throw new Error('glTF byte length must be greater than 0.');
  }

  // TODO - We can avoid copy if already 4-byte aligned...
  // if (byteOffset % 4 === 0) {
  //   tile.gltfArrayBuffer = arrayBuffer;
  //   tile.gltfByteOffset = byteOffset;
  //   tile.gltfByteLength = gltfByteLength;
  // } else {
  // Create a copy of the glb so that it is 4-byte aligned
  // eslint-disable-next-line
  // console.warn(`${tile.type}: embedded glb is not aligned to a 4-byte boundary.`);
  const subArray = new Uint8Array(arrayBuffer).subarray(byteOffset, byteOffset + gltfByteLength);
  const arrayCopy = new Uint8Array(subArray);
  tile.gltfArrayBuffer = arrayCopy.buffer;
  tile.gltfByteOffset = 0;
  tile.gltfByteLength = gltfByteLength;
  // }

  // glTF models need to be rotated from Y to Z up
  // https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#y-up-to-z-up
  tile.rotateYtoZ = true;

  // Entire tile is consumed
  return tile.byteOffset + tile.byteLength;
}

export function extractGLTF(tile, gltfFormat, options) {
  switch (gltfFormat) {
    case GLTF_FORMAT.URI:
      // We need to remove padding from the end of the model URL in case this tile was part of a composite tile.
      // This removes all white space and null characters from the end of the string.
      const gltfUrlBytes = new Uint8Array(tile.gltfArrayBuffer, tile.gltfByteOffset);
      const textDecoder = new TextDecoder();
      const gltfUrl = textDecoder.decode(gltfUrlBytes);
      tile.gltfUrl = gltfUrl.replace(/[\s\0]+$/, '');
      break;
    case GLTF_FORMAT.EMBEDDED:
      tile.gltf = {};
      // parseGLTFSync(tile.gltf, tile.gltfArrayBuffer, tile.gltfByteOffset, options);
      // delete tile.gltfArrayBuffer;
      // delete tile.gltfByteOffset;
      // delete tile.gltfByteLength;
      break;
    default:
      throw new Error(`i3dm: glTF format ${gltfFormat}: Must be 0 (uri) or 1 (embedded)`);
  }
}
