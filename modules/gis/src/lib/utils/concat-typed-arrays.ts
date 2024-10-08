// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import type {TypedArray} from '@loaders.gl/schema';

// TODO: remove copy; import from typed-array-utils
// modules/math/src/geometry/typed-arrays/typed-array-utils.js
export function concatTypedArrays(arrays: TypedArray[]): TypedArray {
  let byteLength = 0;
  for (let i = 0; i < arrays.length; ++i) {
    byteLength += arrays[i].byteLength;
  }
  const buffer = new Uint8Array(byteLength);

  let byteOffset = 0;
  for (let i = 0; i < arrays.length; ++i) {
    const data = new Uint8Array(arrays[i].buffer);
    byteLength = data.length;
    for (let j = 0; j < byteLength; ++j) {
      buffer[byteOffset++] = data[j];
    }
  }
  return buffer;
}
