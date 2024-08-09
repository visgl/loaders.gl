// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {copyBinaryToDataView} from '@loaders.gl/loader-utils';

// Procedurally encode the tile array dataView for testing purposes
export function encodeGltf3DTile(tile, dataView, byteOffset, options) {
  const gltfEncoded = tile.gltfEncoded;
  if (gltfEncoded) {
    byteOffset = copyBinaryToDataView(dataView, byteOffset, gltfEncoded, gltfEncoded.byteLength);
  }

  return byteOffset;
}
