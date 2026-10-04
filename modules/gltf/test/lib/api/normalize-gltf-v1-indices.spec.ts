// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {convertGLTFV1ToGLTF2} from '@loaders.gl/gltf';
import type {GLTFWithBuffers} from '../../../src/lib/types/gltf-types';
import {getTypedArrayForAccessor} from '../../../src/lib/gltf-utils/get-typed-array';

test('glTF 1 retains reserved indices for opaque primitive extension consumers', () => {
  const source = createIndexAsset(5121, 255, 256);
  const json = source.json as any;
  const primitive = json.meshes.mesh.primitives[0];
  json.meshes.opaque = {primitives: [{...primitive, extensions: {CUSTOM_restart: {}}}]};
  const converted = convertGLTFV1ToGLTF2(source);
  const coreIndex = converted.json.meshes![0].primitives[0].indices!;
  const opaqueIndex = converted.json.meshes![1].primitives[0].indices!;
  expect(converted.json.accessors![coreIndex].componentType).toBe(5123);
  expect(converted.json.accessors![opaqueIndex].componentType).toBe(5121);
  expect(converted.json.meshes![1].primitives[0].extensions).toEqual({CUSTOM_restart: {}});
  expect(
    converted.normalizationReport.unsupported.some(message => message.includes('opaque primitive'))
  ).toBe(true);
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow('opaque primitive');
});

test.each([
  {componentType: 5121, index: 254, expectedType: 5121},
  {componentType: 5121, index: 255, expectedType: 5123},
  {componentType: 5123, index: 65534, expectedType: 5123},
  {componentType: 5123, index: 65535, expectedType: 5125},
  {componentType: 5125, index: 256, expectedType: 5125}
])('glTF 1 preserves index $index from component type $componentType', ({
  componentType,
  index,
  expectedType
}) => {
  const source = createIndexAsset(componentType, index, index + 1);
  const originalJson = JSON.stringify(source.json);
  const originalBytes = new Uint8Array(source.buffers[0].arrayBuffer).slice();
  const messages: string[] = [];
  const converted = convertGLTFV1ToGLTF2(source, {
    normalize: 'strict',
    log: {
      log: () => () => {},
      warn: message => () => {
        messages.push(message);
      }
    }
  });
  const accessorIndex = converted.json.meshes![0].primitives[0].indices!;
  expect(converted.json.accessors![accessorIndex].componentType).toBe(expectedType);
  expect(
    Array.from(getTypedArrayForAccessor(converted.json, converted.buffers, accessorIndex))
  ).toEqual([index]);
  expect(converted.normalizationReport.unsupported).toEqual([]);
  expect(messages.some(message => message.includes('Widened'))).toBe(
    expectedType !== componentType
  );
  expect(JSON.stringify(source.json)).toBe(originalJson);
  expect(new Uint8Array(source.buffers[0].arrayBuffer)).toEqual(originalBytes);
});

test('glTF 1 widening separates a shared raw vertex consumer and reads borrowed strided bytes', () => {
  const source = createIndexAsset(5121, 255, 256);
  const json = source.json as any;
  json.accessors.indices.byteStride = 3;
  json.accessors.indices.count = 2;
  new Uint8Array(source.buffers[0].arrayBuffer)[10] = 1;
  json.meshes.other = {primitives: [{mode: 0, attributes: {_RAW: 'indices'}}]};
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  const indices = converted.json.meshes![0].primitives[0].indices!;
  const raw = converted.json.meshes![1].primitives[0].attributes._RAW;
  expect(indices).not.toBe(raw);
  expect(converted.json.accessors![indices].componentType).toBe(5123);
  expect(converted.json.accessors![raw].componentType).toBe(5121);
  expect(Array.from(getTypedArrayForAccessor(converted.json, converted.buffers, indices))).toEqual([
    255, 1
  ]);
  expect(Array.from(getTypedArrayForAccessor(converted.json, converted.buffers, raw))).toEqual([
    255, 1
  ]);
});

test.each([
  {label: 'out of range', componentType: 5121, index: 255, count: 255, message: 'outside'},
  {
    label: 'uint32 restart',
    componentType: 5125,
    index: 4294967295,
    count: 3,
    message: 'unrepresentable'
  },
  {label: 'signed', componentType: 5122, index: 1, count: 3, message: 'unsigned SCALAR'},
  {label: 'float', componentType: 5126, index: 1, count: 3, message: 'unsigned SCALAR'}
])('glTF 1 diagnoses $label indices', ({componentType, index, count, message}) => {
  const source = createIndexAsset(componentType, index, count);
  expect(
    convertGLTFV1ToGLTF2(source).normalizationReport.unsupported.some(feature =>
      feature.includes(message)
    )
  ).toBe(true);
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(message);
});

test.each([
  'normalized',
  'vector',
  'missing bytes',
  'opaque bytes',
  'empty attributes',
  'invalid count',
  'mismatched vertices',
  'smaller consumer'
])('glTF 1 checks index and vertex boundaries: %s', condition => {
  const source = createIndexAsset(5121, 2, 3);
  const json = source.json as any;
  if (condition === 'normalized') json.accessors.indices.normalized = true;
  else if (condition === 'vector') json.accessors.indices.type = 'VEC2';
  else if (condition === 'missing bytes') source.buffers = [];
  else if (condition === 'opaque bytes') json.accessors.indices.extensions = {custom: {}};
  else if (condition === 'empty attributes') json.meshes.mesh.primitives[0].attributes = {};
  else if (condition === 'invalid count') json.accessors.vertices.count = 0;
  else {
    json.accessors.short = {...json.accessors.vertices, count: 2};
    if (condition === 'mismatched vertices')
      json.meshes.mesh.primitives[0].attributes._OTHER = 'short';
    else
      json.meshes.small = {
        primitives: [{mode: 0, attributes: {_VERTEX: 'short'}, indices: 'indices'}]
      };
  }
  expect(convertGLTFV1ToGLTF2(source).normalizationReport.unsupported.length).toBeGreaterThan(0);
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow();
});

test('glTF 1 rejects unresolved vertex attribute IDs before payload processing', () => {
  const source = createIndexAsset(5121, 2, 3);
  (source.json as any).meshes.mesh.primitives[0].attributes._VERTEX = 'missing';
  expect(() => convertGLTFV1ToGLTF2(source)).toThrow('failed to resolve accessor');
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(
    'failed to resolve accessor'
  );
});

/** Compact custom vertex data exercises 16-bit limits without a large position fixture. */
function createIndexAsset(
  componentType: number,
  index: number,
  vertexCount: number
): GLTFWithBuffers {
  const arrayBuffer = new ArrayBuffer(7 + 8 + vertexCount);
  new Uint8Array(arrayBuffer).fill(0xa5);
  const data = new DataView(arrayBuffer);
  if (componentType === 5121) data.setUint8(7, index);
  else if (componentType === 5123) data.setUint16(7, index, true);
  else if (componentType === 5122) data.setInt16(7, index, true);
  else if (componentType === 5126) data.setFloat32(7, index, true);
  else data.setUint32(7, index, true);
  return {
    json: {
      asset: {version: '1.0'},
      buffers: {data: {byteLength: 8 + vertexCount}},
      bufferViews: {
        indices: {buffer: 'data', byteLength: 8},
        vertices: {buffer: 'data', byteOffset: 8, byteLength: vertexCount}
      },
      accessors: {
        vertices: {bufferView: 'vertices', componentType: 5121, type: 'SCALAR', count: vertexCount},
        indices: {bufferView: 'indices', componentType, type: 'SCALAR', count: 1}
      },
      meshes: {
        mesh: {primitives: [{mode: 0, attributes: {_VERTEX: 'vertices'}, indices: 'indices'}]}
      }
    },
    buffers: [{arrayBuffer, byteOffset: 7, byteLength: 8 + vertexCount}]
  } as unknown as GLTFWithBuffers;
}
