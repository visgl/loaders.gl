// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {convertGLTFV1ToGLTF2, normalizeGLTFV1} from '@loaders.gl/gltf';
import {getTypedArrayForAccessor} from '../../../src/lib/gltf-utils/get-typed-array';
import {createAccessorAsset} from '../../test-utils/create-gltf-v1-accessor';
import {createSkinAsset, BAKED_MATRICES} from '../../test-utils/create-gltf-v1-skin';

test.each([
  {type: 'MAT2', componentType: 5121, componentSize: 1, rows: 2},
  {type: 'MAT3', componentType: 5121, componentSize: 1, rows: 3},
  {type: 'MAT3', componentType: 5123, componentSize: 2, rows: 3}
])('glTF 1 $type/$componentType gains column padding without changing matrix components', ({
  type,
  componentType,
  componentSize,
  rows
}) => {
  const componentCount = rows * rows;
  const source = createAccessorAsset(
    {accessors: {matrix: {bufferView: 'view', componentType, type, count: 2}}},
    componentCount * componentSize * 2,
    7
  );
  const data = new DataView(source.buffers[0].arrayBuffer);
  const values = Array.from({length: componentCount * 2}, (_, index) => index + 1);
  values.forEach((value, index) =>
    componentSize === 1
      ? data.setUint8(7 + index, value)
      : data.setUint16(7 + index * 2, value, true)
  );
  const originalBytes = new Uint8Array(source.buffers[0].arrayBuffer).slice();
  const originalJson = JSON.stringify(source.json);
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  expect(Array.from(getTypedArrayForAccessor(converted.json, converted.buffers, 0))).toEqual(
    values
  );
  const view = converted.json.bufferViews![converted.json.accessors![0].bufferView!];
  const bytes = new Uint8Array(converted.buffers[0].arrayBuffer, view.byteOffset, view.byteLength);
  const columnStride = Math.ceil((rows * componentSize) / 4) * 4;
  for (let columnIndex = 0; columnIndex < rows * 2; columnIndex++) {
    expect(
      Array.from(
        bytes.subarray(
          columnIndex * columnStride + rows * componentSize,
          (columnIndex + 1) * columnStride
        )
      )
    ).toEqual(new Array(columnStride - rows * componentSize).fill(0));
  }
  expect(new Uint8Array(source.buffers[0].arrayBuffer)).toEqual(originalBytes);
  expect(JSON.stringify(source.json)).toBe(originalJson);
});

test.each([
  {accessorOffset: 1, viewOffset: 0},
  {accessorOffset: 0, viewOffset: 1}
])('glTF 1 misaligned index bytes are copied to an aligned index view: %j', ({
  accessorOffset,
  viewOffset
}) => {
  const source = createAccessorAsset(
    {
      bufferViews: {
        view: {buffer: 'data', byteOffset: viewOffset, byteLength: 8},
        vertices: {buffer: 'data', byteOffset: 12, byteLength: 4}
      },
      accessors: {
        indices: {
          bufferView: 'view',
          byteOffset: accessorOffset,
          componentType: 5123,
          count: 3,
          type: 'SCALAR'
        },
        vertices: {bufferView: 'vertices', componentType: 5121, count: 3, type: 'SCALAR'}
      },
      meshes: {
        mesh: {primitives: [{mode: 0, attributes: {_VERTEX: 'vertices'}, indices: 'indices'}]}
      }
    },
    16,
    3
  );
  const data = new DataView(source.buffers[0].arrayBuffer);
  [0, 2, 1].forEach((value, index) =>
    data.setUint16(3 + viewOffset + accessorOffset + index * 2, value, true)
  );
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  const view = converted.json.bufferViews![converted.json.accessors![0].bufferView!];
  expect(view).toMatchObject({target: 34963, byteLength: 6});
  expect(view.byteOffset! % 4).toBe(0);
  expect(view.byteStride).toBeUndefined();
  expect(Array.from(getTypedArrayForAccessor(converted.json, converted.buffers, 0))).toEqual([
    0, 2, 1
  ]);
});

test('glTF 1 oversized and odd vertex strides are repaired while original image bytes remain available', () => {
  const source = createAccessorAsset(
    {
      accessors: {
        position: {
          bufferView: 'view',
          byteOffset: 1,
          byteStride: 13,
          componentType: 5126,
          count: 2,
          type: 'VEC3'
        }
      },
      meshes: {mesh: {primitives: [{attributes: {POSITION: 'position'}}]}},
      images: {image: {extensions: {KHR_binary_glTF: {bufferView: 'view', mimeType: 'image/png'}}}}
    },
    32,
    5
  );
  const data = new DataView(source.buffers[0].arrayBuffer);
  [1, 2, 3, 4, 5, 6].forEach((value, index) =>
    data.setFloat32(6 + Math.floor(index / 3) * 13 + (index % 3) * 4, value, true)
  );
  const originalBytes = new Uint8Array(source.buffers[0].arrayBuffer).slice();
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  expect(converted.json.images![0].bufferView).toBe(0);
  expect(converted.json.bufferViews![0].byteLength).toBe(32);
  expect(Array.from(getTypedArrayForAccessor(converted.json, converted.buffers, 0))).toEqual([
    1, 2, 3, 4, 5, 6
  ]);
  expect(new Uint8Array(converted.buffers[0].arrayBuffer, 0, 32)).toEqual(
    originalBytes.subarray(5, 37)
  );
});

test('glTF 1 a single element does not require unused trailing stride bytes', () => {
  const source = createAccessorAsset(
    {
      accessors: {
        position: {bufferView: 'view', byteStride: 24, componentType: 5126, count: 1, type: 'VEC3'}
      },
      meshes: {mesh: {primitives: [{attributes: {POSITION: 'position'}}]}}
    },
    12
  );
  new Float32Array(source.buffers[0].arrayBuffer, 0, 3).set([1, 2, 3]);
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  expect(Array.from(getTypedArrayForAccessor(converted.json, converted.buffers, 0))).toEqual([
    1, 2, 3
  ]);
});

test.each([
  {accessor: {extensions: {VENDOR_data: {}}}},
  {accessor: {sparse: {}}},
  {view: {extensions: {VENDOR_data: {}}}},
  {loaded: {byteOffset: -1}},
  {loaded: {byteLength: 1000}},
  {view: {byteOffset: 127}}
])('glTF 1 binary repair rejects unsafe source descriptions: %j', ({accessor, view, loaded}) => {
  const source = createAccessorAsset({
    accessors: {
      matrix: {bufferView: 'view', componentType: 5121, count: 1, type: 'MAT3', ...accessor}
    },
    bufferViews: {view: {buffer: 'data', byteLength: 9, ...view}}
  });
  Object.assign(source.buffers[0], loaded);
  const originalBuffer = source.buffers[0].arrayBuffer;
  expect(() => normalizeGLTFV1(source, {normalize: 'strict'})).toThrow(/requires binary repacking/);
  expect(source.buffers[0].arrayBuffer).toBe(originalBuffer);
});

test('glTF 1 missing repair payloads are diagnosed and strict planning commits no other buffers', () => {
  const source = createAccessorAsset({
    buffers: {
      data: {uri: 'data.bin', byteLength: 128},
      missing: {uri: 'missing.bin', byteLength: 16}
    },
    bufferViews: {
      view: {buffer: 'data', byteLength: 128},
      missing: {buffer: 'missing', byteLength: 16}
    },
    accessors: {
      valid: {bufferView: 'view', componentType: 5121, count: 1, type: 'MAT3'},
      missing: {bufferView: 'missing', componentType: 5121, count: 1, type: 'MAT3'}
    }
  });
  const originalBuffer = source.buffers[0].arrayBuffer;
  expect(() => normalizeGLTFV1(source, {normalize: 'strict'})).toThrow(/loaded accessor buffer/);
  expect(source.buffers[0].arrayBuffer).toBe(originalBuffer);
  expect(source.json.buffers![0].byteLength).toBe(128);
});

test('glTF 1 strided inverse-bind data is repacked before bind-shape baking', () => {
  const source = createSkinAsset({matrixAccessorOverrides: {byteStride: 68}});
  const bytes = new Uint8Array(source.buffers[0].arrayBuffer);
  bytes.copyWithin(85, 81, 145);
  const originalBytes = bytes.slice();
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  const matrixIndex = converted.json.skins![0].inverseBindMatrices!;
  expect(
    Array.from(getTypedArrayForAccessor(converted.json, converted.buffers, matrixIndex))
  ).toEqual(BAKED_MATRICES);
  expect(converted.json.skins![0]).not.toHaveProperty('bindShapeMatrix');
  expect(new Uint8Array(source.buffers[0].arrayBuffer)).toEqual(originalBytes);
});
