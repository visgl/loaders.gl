// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

// TODO - should we automatically parse the embedded glTF or leave it to the app?
// - I.e. some apps might work directly on a GLB, in that case no need for us to decode...
// - And if we decode, do we still keep the GLB in case it is needed?
// - Do we add an option to control this?
// - Also, should we have hard dependency on gltf module or use injection or auto-discovery for gltf parser?

import {GLTFLoader, postProcessGLTF, _getMemoryUsageGLTF} from '@loaders.gl/gltf';
import {LoaderContext, sliceArrayBuffer, parseFromContext} from '@loaders.gl/loader-utils';
import {Tiles3DTileContent} from '../../../types';
import {Tiles3DLoaderOptions} from '../../../tiles-3d-loader';

export const GLTF_FORMAT = {
  URI: 0,
  EMBEDDED: 1
};

export function parse3DTileGLTFViewSync(
  tile: Tiles3DTileContent,
  arrayBuffer: ArrayBuffer,
  byteOffset: number,
  options: Tiles3DLoaderOptions | undefined
) {
  // Set flags
  // glTF models need to be rotated from Y to Z up
  // https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#y-up-to-z-up
  tile.rotateYtoZ = true;

  // Assume glTF consumes rest of tile
  const gltfByteLength = (tile.byteOffset || 0) + (tile.byteLength || 0) - byteOffset;
  if (gltfByteLength === 0) {
    throw new Error('glTF byte length must be greater than 0.');
  }

  // Save gltf up axis
  tile.gltfUpAxis =
    options?.['3d-tiles'] && options['3d-tiles'].assetGltfUpAxis
      ? options['3d-tiles'].assetGltfUpAxis
      : 'Y';

  // TODO - We can avoid copy if already 4-byte aligned...
  // However the rest of the code may not be able to accept byteOffsets, so copy anyway
  tile.gltfArrayBuffer = sliceArrayBuffer(arrayBuffer, byteOffset, gltfByteLength);
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
  return (tile.byteOffset || 0) + (tile.byteLength || 0);
}

export async function extractGLTF(
  tile: Tiles3DTileContent,
  gltfFormat: number,
  options?: Tiles3DLoaderOptions,
  context?: LoaderContext
): Promise<void> {
  const tile3DOptions = options?.['3d-tiles'] || {};

  extractGLTFBufferOrURL(tile, gltfFormat, options);

  if (tile3DOptions.loadGLTF) {
    if (!context) {
      return;
    }
    if (tile.gltfUrl) {
      const {fetch} = context;
      const response = await fetch(tile.gltfUrl, options);
      tile.gltfArrayBuffer = await response.arrayBuffer();
      tile.gltfByteOffset = 0;
    }
    if (tile.gltfArrayBuffer) {
      // TODO - Should handle byteOffset... However, not used now...
      const gltfWithBuffers = await parseFromContext(
        tile.gltfArrayBuffer,
        GLTFLoader,
        options,
        context
      );
      tile.gltf = postProcessGLTF(gltfWithBuffers);
      tile.gpuMemoryUsageInBytes = _getMemoryUsageGLTF(tile.gltf);
      delete tile.gltfArrayBuffer;
      delete tile.gltfByteOffset;
      delete tile.gltfByteLength;
    }
  }
}

function extractGLTFBufferOrURL(
  tile: Tiles3DTileContent,
  gltfFormat: number,
  options: Tiles3DLoaderOptions | undefined
) {
  switch (gltfFormat) {
    case GLTF_FORMAT.URI:
      // We need to remove padding from the end of the model URL in case this tile was part of a composite tile.
      // This removes all white space and null characters from the end of the string.
      if (tile.gltfArrayBuffer) {
        const gltfUrlBytes = new Uint8Array(tile.gltfArrayBuffer, tile.gltfByteOffset);
        const textDecoder = new TextDecoder();
        const gltfUrl = textDecoder.decode(gltfUrlBytes);
        tile.gltfUrl = gltfUrl.replace(/[\s\0]+$/, '');
      }
      delete tile.gltfArrayBuffer;
      delete tile.gltfByteOffset;
      delete tile.gltfByteLength;
      break;
    case GLTF_FORMAT.EMBEDDED:
      break;
    default:
      throw new Error('b3dm: Illegal glTF format field');
  }
}
