// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {assert} from '@loaders.gl/loader-utils';

// Decode the JSON binary array into clear text
export function getStringFromArrayBuffer(arrayBuffer, byteOffset, byteLength) {
  assert(arrayBuffer instanceof ArrayBuffer);
  const textDecoder = new TextDecoder('utf8');
  const typedArray = new Uint8Array(arrayBuffer, byteOffset, byteLength);
  const string = textDecoder.decode(typedArray);
  return string;
}

// Decode the JSON binary array into clear text
export function getStringFromTypedArray(typedArray) {
  assert(ArrayBuffer.isView(typedArray));
  const textDecoder = new TextDecoder('utf8');
  const string = textDecoder.decode(typedArray);
  return string;
}

export function getMagicString(arrayBuffer, byteOffset = 0) {
  const dataView = new DataView(arrayBuffer);
  return `\
${String.fromCharCode(dataView.getUint8(byteOffset + 0))}\
${String.fromCharCode(dataView.getUint8(byteOffset + 1))}\
${String.fromCharCode(dataView.getUint8(byteOffset + 2))}\
${String.fromCharCode(dataView.getUint8(byteOffset + 3))}`;
}
