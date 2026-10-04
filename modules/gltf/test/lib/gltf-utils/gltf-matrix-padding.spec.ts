// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {GLTFScenegraph} from '@loaders.gl/gltf';
import type {GLTFWithBuffers} from '../../../src/lib/types/gltf-types';

test.each([
  {componentType: 5121, componentSize: 1, byteStride: 16},
  {componentType: 5123, componentSize: 2, byteStride: 24}
])('glTF padded matrices decode across strides and an omitted final padding byte: $componentType', ({
  componentType,
  componentSize,
  byteStride
}) => {
  const columnStride = componentSize === 1 ? 4 : 8;
  const byteLength = byteStride + columnStride * 2 + componentSize * 3;
  const arrayBuffer = new ArrayBuffer(byteLength + 5);
  new Uint8Array(arrayBuffer).fill(0xee);
  const data = new DataView(arrayBuffer);
  const values = Array.from({length: 18}, (_, index) => index + 1);
  values.forEach((value, index) => {
    const byteOffset =
      5 +
      Math.floor(index / 9) * byteStride +
      Math.floor((index % 9) / 3) * columnStride +
      (index % 3) * componentSize;
    if (componentSize === 1) data.setUint8(byteOffset, value);
    else data.setUint16(byteOffset, value, true);
  });
  const gltf: GLTFWithBuffers = {
    json: {
      asset: {version: '2.0'},
      buffers: [{byteLength}],
      bufferViews: [{buffer: 0, byteLength, byteStride}],
      accessors: [{bufferView: 0, componentType, type: 'MAT3', count: 2}]
    },
    buffers: [{arrayBuffer, byteOffset: 5, byteLength}]
  };
  const scenegraph = new GLTFScenegraph(gltf);
  expect(Array.from(scenegraph.getTypedArrayForAccessor(0))).toEqual(values);
  gltf.json.bufferViews![0].byteLength -= 1;
  expect(() => scenegraph.getTypedArrayForAccessor(0)).toThrow();
});
