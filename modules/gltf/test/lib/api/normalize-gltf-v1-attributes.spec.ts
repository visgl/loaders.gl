// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {convertGLTFV1ToGLTF2} from '@loaders.gl/gltf';
import {getTypedArrayForAccessor} from '../../../src/lib/gltf-utils/get-typed-array';
import {createAccessorAsset} from '../../test-utils/create-gltf-v1-accessor';

test.each([
  '5121',
  'toString'
])('glTF 1 conversion rejects non-numeric component type %s before reading bytes', componentType => {
  const source = createAccessorAsset(
    {
      accessors: {joints: {bufferView: 'view', componentType, type: 'VEC4', count: 1}},
      meshes: {mesh: {primitives: [{mode: 0, attributes: {JOINT: 'joints'}}]}}
    },
    4
  );
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(
    'invalid component type'
  );
});

test.each([
  {componentType: 5126, values: [0, 255, 1, 2], target: 5121},
  {componentType: 5126, values: [0, 256, 65535, 2], target: 5123},
  {componentType: 5120, values: [0, 127, 1, 2], target: 5121},
  {componentType: 5122, values: [0, 300, 1, 2], target: 5123},
  {componentType: 5125, values: [0, 65535, 1, 2], target: 5123}
])('glTF 1 joint indices convert $componentType to $target without changing palette indices', ({
  componentType,
  values,
  target
}) => {
  const source = createAccessorAsset(
    {
      accessors: {
        joints: {
          bufferView: 'view',
          componentType,
          type: 'VEC4',
          count: 1,
          min: [0, 0, 0, 0],
          max: values
        }
      },
      meshes: {mesh: {primitives: [{mode: 0, attributes: {JOINT_0: 'joints', _RAW: 'joints'}}]}}
    },
    32,
    3
  );
  const data = new DataView(source.buffers[0].arrayBuffer);
  values.forEach((value, index) => {
    if (componentType === 5126) data.setFloat32(3 + index * 4, value, true);
    else if (componentType === 5120) data.setInt8(3 + index, value);
    else if (componentType === 5122) data.setInt16(3 + index * 2, value, true);
    else data.setUint32(3 + index * 4, value, true);
  });
  const bytes = new Uint8Array(source.buffers[0].arrayBuffer).slice();
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  const attributes = converted.json.meshes![0].primitives[0].attributes;
  expect(attributes.JOINTS_0).not.toBe(attributes._RAW);
  expect(converted.json.accessors![attributes.JOINTS_0]).toMatchObject({
    componentType: target,
    type: 'VEC4'
  });
  expect(converted.json.accessors![attributes.JOINTS_0]).not.toHaveProperty('min');
  expect(converted.json.accessors![attributes._RAW].componentType).toBe(componentType);
  expect(
    Array.from(getTypedArrayForAccessor(converted.json, converted.buffers, attributes.JOINTS_0))
  ).toEqual(values);
  expect(
    Array.from(getTypedArrayForAccessor(converted.json, converted.buffers, attributes._RAW))
  ).toEqual(values);
  expect(new Uint8Array(source.buffers[0].arrayBuffer)).toEqual(bytes);
});

test.each([
  -1,
  0.5,
  65536,
  Number.NaN,
  Number.POSITIVE_INFINITY
])('glTF 1 joint conversion rejects invalid index %s', invalid => {
  const source = createAccessorAsset(
    {
      accessors: {joints: {bufferView: 'view', componentType: 5126, type: 'VEC4', count: 1}},
      meshes: {mesh: {primitives: [{mode: 0, attributes: {JOINT: 'joints'}}]}}
    },
    16
  );
  new Float32Array(source.buffers[0].arrayBuffer, 0, 4).set([0, invalid, 1, 2]);
  const converted = convertGLTFV1ToGLTF2(source);
  expect(converted.normalizationReport.unsupported).toContain(
    'accessor 0 joint indices require finite integers in [0, 65535]'
  );
  expect(converted.json.accessors![0].componentType).toBe(5126);
  expect(converted.buffers[0].arrayBuffer).toBe(source.buffers[0].arrayBuffer);
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(/finite integers/);
});

test.each([
  {normalized: true},
  {type: 'MAT2'}
])('glTF 1 joint interpretation rejects incompatible metadata: %j', overrides => {
  const source = createAccessorAsset({
    accessors: {
      joints: {bufferView: 'view', componentType: 5121, type: 'VEC4', count: 1, ...overrides}
    },
    meshes: {mesh: {primitives: [{mode: 0, attributes: {JOINT: 'joints'}}]}}
  });
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(
    /unnormalized|scalar\/vector/
  );
});

test.each([
  {semantic: 'COLOR', componentType: 5121, type: 'VEC3', values: [1, 0, 1]},
  {semantic: 'WEIGHT', componentType: 5123, type: 'VEC4', values: [0, 1, 0, 0]},
  {semantic: 'TEXCOORD', componentType: 5123, type: 'VEC2', values: [1, 0]}
])('glTF 1 literal integer $semantic values in [0,1] keep their shader input values', ({
  semantic,
  componentType,
  type,
  values
}) => {
  const source = createAccessorAsset({
    accessors: {attribute: {bufferView: 'view', componentType, type, count: 1}},
    meshes: {mesh: {primitives: [{mode: 0, attributes: {[semantic]: 'attribute'}}]}}
  });
  if (componentType === 5121)
    new Uint8Array(source.buffers[0].arrayBuffer, 0, values.length).set(values);
  else new Uint16Array(source.buffers[0].arrayBuffer, 0, values.length).set(values);
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  expect(converted.json.accessors![0].componentType).toBe(5126);
  expect(converted.json.accessors![0].normalized).toBeUndefined();
  expect(Array.from(getTypedArrayForAccessor(converted.json, converted.buffers, 0))).toEqual(
    values
  );
});

test.each([
  {semantic: 'COLOR', componentType: 5121, values: [255, 128, 0, 255]},
  {semantic: 'WEIGHT', componentType: 5123, values: [65535, 0, 0, 0]}
])('glTF 1 quantized $semantic normalization assumptions are explicit and preserve custom consumers', ({
  semantic,
  componentType,
  values
}) => {
  const source = createAccessorAsset({
    accessors: {attribute: {bufferView: 'view', componentType, type: 'VEC4', count: 1}},
    meshes: {
      mesh: {primitives: [{mode: 0, attributes: {[semantic]: 'attribute', RAW: 'attribute'}}]}
    }
  });
  if (componentType === 5121) new Uint8Array(source.buffers[0].arrayBuffer, 0, 4).set(values);
  else new Uint16Array(source.buffers[0].arrayBuffer, 0, 4).set(values);
  const converted = convertGLTFV1ToGLTF2(source);
  const attributes = converted.json.meshes![0].primitives[0].attributes;
  const standardIndex = attributes[semantic === 'COLOR' ? 'COLOR_0' : 'WEIGHTS_0'];
  expect(converted.json.accessors![standardIndex].normalized).toBe(true);
  expect(converted.json.accessors![attributes._RAW].normalized).toBeUndefined();
  expect(converted.buffers[0].arrayBuffer).toBe(source.buffers[0].arrayBuffer);
  expect(converted.normalizationReport.unsupported).toEqual([
    expect.stringContaining('ambiguous integer attribute normalization')
  ]);
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(
    /ambiguous integer attribute normalization/
  );
});

test('glTF 1 explicit normalized integer colors remain supported without assumptions', () => {
  const source = createAccessorAsset({
    accessors: {
      color: {bufferView: 'view', componentType: 5121, type: 'VEC4', count: 1, normalized: true}
    },
    meshes: {mesh: {primitives: [{mode: 0, attributes: {COLOR: 'color'}}]}}
  });
  expect(
    convertGLTFV1ToGLTF2(source, {normalize: 'strict'}).normalizationReport.unsupported
  ).toEqual([]);
});

test.each([
  ['TEMPERATURE', '_TEMPERATURE'],
  ['JOINT', 'JOINT_0'],
  ['JOINT_01', 'JOINT_1']
])('glTF 1 aliases %s and %s cannot silently overwrite one another', (firstName, secondName) => {
  const source = createAccessorAsset({
    accessors: {
      first: {componentType: 5126, type: 'SCALAR', count: 1},
      second: {componentType: 5126, type: 'SCALAR', count: 1}
    },
    meshes: {
      mesh: {primitives: [{mode: 0, attributes: {[firstName]: 'first', [secondName]: 'second'}}]}
    }
  });
  expect(() => convertGLTFV1ToGLTF2(source)).toThrow(/conflicting attribute aliases/);
});

test('glTF 1 custom namespaces and indexed aliases normalize safely', () => {
  const valid = createAccessorAsset({
    accessors: {attribute: {componentType: 5126, type: 'SCALAR', count: 1}},
    meshes: {
      mesh: {
        primitives: [
          {
            attributes: {
              TEMPERATURE: 'attribute',
              'VENDOR_data:VALUE': 'attribute',
              JOINT_01: 'attribute'
            }
          }
        ]
      }
    }
  });
  expect(Object.keys(convertGLTFV1ToGLTF2(valid).json.meshes![0].primitives[0].attributes)).toEqual(
    ['_TEMPERATURE', 'VENDOR_data:VALUE', 'JOINTS_1']
  );
  const invalid = createAccessorAsset({
    meshes: {mesh: {primitives: [{mode: 0, attributes: {JOINT_1000000000: 'attribute'}}]}}
  });
  expect(() => convertGLTFV1ToGLTF2(invalid)).toThrow(/invalid attribute set index/);
});

test('glTF 1 preserves a custom __proto__ attribute as an own JSON property', () => {
  const converted = convertGLTFV1ToGLTF2(
    createAccessorAsset({
      accessors: {attribute: {componentType: 5126, type: 'SCALAR', count: 1}},
      meshes: {mesh: {primitives: [{mode: 0, attributes: JSON.parse('{"__proto__":"attribute"}')}]}}
    })
  );
  const attributes = converted.json.meshes![0].primitives[0].attributes;
  expect(Object.hasOwn(attributes, '__proto__')).toBe(true);
  expect(JSON.stringify(attributes)).toBe('{"__proto__":0}');
  expect(Object.getPrototypeOf(attributes)).toBe(Object.prototype);
});
