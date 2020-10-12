// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

/* global TextDecoder */

// TODO - should we automatically parse the embedded glTF or leave it to the app?
// - I.e. some apps might work directly on a GLB, in that case no need for us to decode...
// - And if we decode, do we still keep the GLB in case it is needed?
// - Do we add an option to control this?
// - Also, should we have hard dependency on gltf module or use injection or auto-discovery for gltf parser?

import {GLTFLoader} from '@loaders.gl/gltf';
import {getZeroOffsetArrayBuffer} from '@loaders.gl/loader-utils';

export const GLTF_FORMAT = {
  URI: 0,
  EMBEDDED: 1
};

export function parse3DTileGLTFViewSync(tile, arrayBuffer, byteOffset, options) {
  // Set flags
  // glTF models need to be rotated from Y to Z up
  // https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#y-up-to-z-up
  tile.rotateYtoZ = true;

  // Assume glTF consumes rest of tile
  const gltfByteLength = tile.byteOffset + tile.byteLength - byteOffset;
  if (gltfByteLength === 0) {
    throw new Error('glTF byte length must be greater than 0.');
  }

  // Save gltf up axis
  tile.gltfUpAxis =
    options['3d-tiles'] && options['3d-tiles'].assetGltfUpAxis
      ? options['3d-tiles'].assetGltfUpAxis
      : 'Y';

  // TODO - We can avoid copy if already 4-byte aligned...
  // However the rest of the code may not be able to accept byteOffsets, so copy anyway
  tile.gltfArrayBuffer = getZeroOffsetArrayBuffer(arrayBuffer, byteOffset, gltfByteLength);
  tile.gltfByteOffset = 0;
  tile.gltfByteLength = gltfByteLength;

  if (byteOffset % 4 === 0) {
    // tile.gltfArrayBuffer = arrayBuffer;
    // tile.gltfByteOffset = byteOffset;
    // tile.gltfByteLength = gltfByteLength;
  } else {
    // Create a copy of the glb so that it is 4-byte aligned
    // eslint-disable-next-line
    console.warn(`${tile.type}: embedded glb is not aligned to a 4-byte boundary.`);
  }

  // Entire tile is consumed
  return tile.byteOffset + tile.byteLength;
}

export async function extractGLTF(tile, gltfFormat, options, context) {
  const tile3DOptions = options['3d-tiles'] || {};

  extractGLTFBufferOrURL(tile, gltfFormat, options);

  if (tile3DOptions.loadGLTF) {
    const {parse, fetch} = context;
    if (tile.gltfUrl) {
      tile.gltfArrayBuffer = await fetch(tile.gltfUrl, options);
      tile.gltfByteOffset = 0;
    }
    if (tile.gltfArrayBuffer) {
      // TODO - Should handle byteOffset... However, not used now...
      tile.gltf = await parse(tile.gltfArrayBuffer, GLTFLoader, options, context);
      delete tile.gltfArrayBuffer;
      delete tile.gltfByteOffset;
      delete tile.gltfByteLength;
    }
  }
}

function extractGLTFBufferOrURL(tile, gltfFormat, options) {
  switch (gltfFormat) {
    case GLTF_FORMAT.URI:
      // We need to remove padding from the end of the model URL in case this tile was part of a composite tile.
      // This removes all white space and null characters from the end of the string.
      const gltfUrlBytes = new Uint8Array(tile.gltfArrayBuffer, tile.gltfByteOffset);
      const textDecoder = new TextDecoder();
      const gltfUrl = textDecoder.decode(gltfUrlBytes);
      tile.gltfUrl = gltfUrl.replace(/[\s\0]+$/, '');
      delete tile.gltfArrayBuffer;
      delete tile.gltfByteOffset;
      delete tile.gltfByteLength;
      break;
    case GLTF_FORMAT.EMBEDDED:
      break;
    default:
      throw new Error(`b3dm: Illegal glTF format field`);
  }
}
