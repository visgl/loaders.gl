// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {convertGLTFV1ToGLTF2} from '@loaders.gl/gltf';
import {getTypedArrayForAccessor} from '../../../src/lib/gltf-utils/get-typed-array';
import {createGLTFV1ConformanceAsset} from '../../test-utils/create-gltf-v1-conformance';

test('glTF 1 converts smaller influences, detached scenes, and required bounds without changing source data', () => {
  const source = createGLTFV1ConformanceAsset();
  const originalJson = JSON.stringify(source.json);
  const originalBytes = new Uint8Array(source.buffers[0].arrayBuffer).slice();
  const warn = vi.fn(() => vi.fn());
  const converted = convertGLTFV1ToGLTF2(source, {
    normalize: 'strict',
    log: {log: () => () => {}, warn}
  });
  const attributes = converted.json.meshes![0].primitives[0].attributes;
  expect(converted.normalizationReport.unsupported).toEqual([]);
  expect(converted.json.scenes![0].nodes).toEqual([2, 0]);
  expect(converted.json.nodes![0].translation).toEqual([7, 0, 0]);
  expect(converted.json.accessors![0]).toMatchObject({min: [-1, 2, 2], max: [1, 5, 3]});
  expect(converted.json.accessors![3]).toMatchObject({min: [0], max: [1]});
  expect(converted.json.accessors![attributes.JOINTS_0]).toMatchObject({
    componentType: 5121,
    type: 'VEC4'
  });
  expect(converted.json.accessors![attributes.WEIGHTS_0]).toMatchObject({
    componentType: 5126,
    type: 'VEC4'
  });
  expect(
    Array.from(getTypedArrayForAccessor(converted.json, converted.buffers, attributes.JOINTS_0))
  ).toEqual([0, 1, 0, 0, 1, 0, 0, 0]);
  expect(
    Array.from(getTypedArrayForAccessor(converted.json, converted.buffers, attributes.WEIGHTS_0))
  ).toEqual([0.25, 0.75, 0, 0, 1, 0, 0, 0]);
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('Attached detached skeleton'));
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('Calculated required bounds'));
  expect(JSON.stringify(source.json)).toBe(originalJson);
  expect(new Uint8Array(source.buffers[0].arrayBuffer)).toEqual(originalBytes);
});

test('glTF 1 repairs incorrect position bounds from interleaved raw data', () => {
  const source = createGLTFV1ConformanceAsset();
  const json = source.json as any;
  Object.assign(json.accessors.positions, {byteOffset: 88, byteStride: 16});
  const data = new DataView(source.buffers[0].arrayBuffer);
  [1, 2, 3].forEach((value, index) => data.setFloat32(95 + index * 4, value, true));
  [-1, 5, 2].forEach((value, index) => data.setFloat32(111 + index * 4, value, true));
  json.accessors.positions.min = [999, 999, 999];
  json.accessors.positions.max = [-999, -999, -999];
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  expect(converted.json.accessors![0]).toMatchObject({min: [-1, 2, 2], max: [1, 5, 3]});
});

test('glTF 1 padding separates raw custom consumers from converted influences', () => {
  const source = createGLTFV1ConformanceAsset();
  const json = source.json as any;
  json.meshes.mesh.primitives[0].attributes._RAWJOINT = 'joints';
  json.meshes.mesh.primitives[0].attributes._RAWWEIGHT = 'weights';
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  const attributes = converted.json.meshes![0].primitives[0].attributes;
  expect(converted.json.accessors![attributes._RAWJOINT]).toMatchObject({
    componentType: 5126,
    type: 'VEC2'
  });
  expect(converted.json.accessors![attributes._RAWWEIGHT].type).toBe('VEC2');
  expect(
    Array.from(getTypedArrayForAccessor(converted.json, converted.buffers, attributes._RAWWEIGHT))
  ).toEqual([0.25, 0.75, 1, 0]);
});

test.each(['SCALAR', 'VEC3'])('glTF 1 pads %s influences while preserving active values', type => {
  const source = createGLTFV1ConformanceAsset();
  const json = source.json as any;
  const rows = type === 'SCALAR' ? 1 : 3;
  json.accessors.joints = {...json.accessors.joints, type, count: 1, byteStride: rows * 4};
  json.accessors.weights = {...json.accessors.weights, type, count: 1, byteStride: rows * 4};
  json.accessors.positions.count = 1;
  const data = new DataView(source.buffers[0].arrayBuffer);
  [0, 1, 0].slice(0, rows).forEach((value, index) => data.setFloat32(31 + index * 4, value, true));
  [1, 0, 0].slice(0, rows).forEach((value, index) => data.setFloat32(47 + index * 4, value, true));
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  expect(Array.from(getTypedArrayForAccessor(converted.json, converted.buffers, 1))).toEqual([
    0,
    rows > 1 ? 1 : 0,
    0,
    0
  ]);
  expect(Array.from(getTypedArrayForAccessor(converted.json, converted.buffers, 2))).toEqual([
    1, 0, 0, 0
  ]);
});

test.each([
  {label: 'palette range', change: (json: any, data: DataView) => data.setFloat32(31, 2, true)},
  {label: 'weight sum', change: (json: any, data: DataView) => data.setFloat32(47, 0.5, true)},
  {
    label: 'negative weights',
    change: (json: any, data: DataView) => data.setFloat32(47, -0.25, true)
  },
  {
    label: 'repeated weighted joints',
    change: (json: any, data: DataView) => data.setFloat32(35, 0, true)
  },
  {
    label: 'unpaired sets',
    change: (json: any) => delete json.meshes.mesh.primitives[0].attributes.WEIGHT
  },
  {
    label: 'set gaps',
    change: (json: any) => {
      const attributes = json.meshes.mesh.primitives[0].attributes;
      attributes.JOINT_1 = attributes.JOINT;
      attributes.WEIGHT_1 = attributes.WEIGHT;
      delete attributes.JOINT;
      delete attributes.WEIGHT;
    }
  },
  {label: 'vertex count', change: (json: any) => (json.accessors.positions.count = 1)}
])('glTF 1 reports invalid skin $label and rejects it in strict mode', ({change}) => {
  const source = createGLTFV1ConformanceAsset();
  change(source.json, new DataView(source.buffers[0].arrayBuffer));
  expect(
    convertGLTFV1ToGLTF2(source).normalizationReport.unsupported.some(feature =>
      feature.includes('skin 0')
    )
  ).toBe(true);
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(/skin 0/);
});

test('glTF 1 checks normalized integer weights and unsigned joint indices even when no storage conversion is needed', () => {
  const source = createGLTFV1ConformanceAsset();
  const json = source.json as any;
  Object.assign(json.accessors.joints, {componentType: 5121, type: 'VEC4', byteStride: 4});
  Object.assign(json.accessors.weights, {
    componentType: 5121,
    type: 'VEC4',
    byteStride: 4,
    normalized: true
  });
  new Uint8Array(source.buffers[0].arrayBuffer, 31, 8).set([0, 1, 0, 0, 1, 0, 0, 0]);
  new Uint8Array(source.buffers[0].arrayBuffer, 47, 8).set([127, 128, 0, 0, 255, 0, 0, 0]);
  expect(
    convertGLTFV1ToGLTF2(source, {normalize: 'strict'}).normalizationReport.unsupported
  ).toEqual([]);
  new Uint8Array(source.buffers[0].arrayBuffer)[31] = 2;
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(/palette index/);
});

test.each([
  {label: 'missing payload', change: (source: any) => (source.buffers = [])},
  {
    label: 'non-finite position',
    change: (source: any) =>
      new DataView(source.buffers[0].arrayBuffer).setFloat32(7, Infinity, true)
  },
  {
    label: 'opaque position extension',
    change: (source: any) => (source.json.accessors.positions.extensions = {VENDOR_unknown: {}})
  }
])('glTF 1 bounds do not infer $label', ({change}) => {
  const source = createGLTFV1ConformanceAsset();
  change(source);
  expect(convertGLTFV1ToGLTF2(source).normalizationReport.unsupported.length).toBeGreaterThan(0);
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow();
});

test('glTF 1 combines influence sets and detects repeated weighted joints across sets', () => {
  const source = createGLTFV1ConformanceAsset();
  const json = source.json as any;
  json.accessors.extraJoints = {...json.accessors.joints, byteOffset: 88};
  json.accessors.extraWeights = {...json.accessors.weights, byteOffset: 104};
  const attributes = json.meshes.mesh.primitives[0].attributes;
  attributes.JOINT_1 = 'extraJoints';
  attributes.WEIGHT_1 = 'extraWeights';
  const data = new DataView(source.buffers[0].arrayBuffer);
  [0, 0, 0, 0].forEach((value, index) => data.setFloat32(95 + index * 4, value, true));
  [0.25, 0, 0.5, 0].forEach((value, index) => data.setFloat32(111 + index * 4, value, true));
  [0, 1, 1, 0].forEach((value, index) => data.setFloat32(31 + index * 4, value, true));
  [0, 0.75, 0.5, 0].forEach((value, index) => data.setFloat32(47 + index * 4, value, true));
  expect(
    convertGLTFV1ToGLTF2(source, {normalize: 'strict'}).normalizationReport.unsupported
  ).toEqual([]);
  data.setFloat32(95, 1, true);
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(
    'repeated weighted joint'
  );
});

test('glTF 1 validates one shared mesh against every skin palette', () => {
  const source = createGLTFV1ConformanceAsset();
  const json = source.json as any;
  json.skins.small = {jointNames: ['root']};
  json.nodes.secondInstance = {meshes: ['mesh'], skin: 'small', skeletons: ['root']};
  json.scenes.scene.nodes.push('secondInstance');
  expect(convertGLTFV1ToGLTF2(source).normalizationReport.unsupported).toEqual(
    expect.arrayContaining([expect.stringContaining('skin 1 invalid palette index')])
  );
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow('skin 1');
});

test('glTF 1 pads normalized unsigned weights without changing quantized values', () => {
  const source = createGLTFV1ConformanceAsset();
  const json = source.json as any;
  Object.assign(json.accessors.weights, {componentType: 5123, normalized: true, byteStride: 4});
  const data = new DataView(source.buffers[0].arrayBuffer);
  [32767, 32768, 65535, 0].forEach((value, index) => data.setUint16(47 + index * 2, value, true));
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  expect(converted.json.accessors![2]).toMatchObject({
    type: 'VEC4',
    componentType: 5123,
    normalized: true
  });
  expect(Array.from(getTypedArrayForAccessor(converted.json, converted.buffers, 2))).toEqual([
    32767, 32768, 0, 0, 65535, 0, 0, 0
  ]);
});

test('glTF 1 reports unavailable position payloads even when bounds are already present', () => {
  const source = createGLTFV1ConformanceAsset();
  const json = source.json as any;
  json.meshes.mesh.primitives[0].attributes = {POSITION: 'positions'};
  delete json.skins;
  delete json.animations;
  delete json.nodes.instance.skin;
  delete json.nodes.instance.skeletons;
  json.accessors.positions.min = [-1, 2, 2];
  json.accessors.positions.max = [1, 5, 3];
  source.buffers = [];
  expect(convertGLTFV1ToGLTF2(source).normalizationReport.unsupported).toContain(
    'POSITION accessor 0: requires a loaded accessor buffer'
  );
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(
    'loaded accessor buffer'
  );
});
