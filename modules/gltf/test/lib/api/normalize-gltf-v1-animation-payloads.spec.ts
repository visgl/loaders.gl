// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {convertGLTFV1ToGLTF2} from '@loaders.gl/gltf';
import {createGLTFV1ConformanceAsset} from '../../test-utils/create-gltf-v1-conformance';

test.each([
  'LINEAR',
  'STEP'
])('glTF 1 retains compatible %s keys and supplies time bounds', interpolation => {
  const source = createGLTFV1ConformanceAsset();
  (source.json as any).animations.animation.samplers.sampler.interpolation = interpolation;
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  expect(converted.json.animations![0].samplers[0]).toMatchObject({
    input: 3,
    output: 4,
    interpolation
  });
  expect(converted.json.accessors![3]).toMatchObject({min: [0], max: [1]});
});

test('glTF 1 hybrid array samplers still resolve parameters and legacy channel targets', () => {
  const source = createGLTFV1ConformanceAsset();
  const animation = (source.json as any).animations.animation;
  animation.samplers = [{input: 'TIME', output: 'VALUE'}];
  animation.channels[0].sampler = 0;
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  expect(converted.json.animations![0].samplers[0]).toEqual({
    input: 3,
    output: 4,
    interpolation: 'LINEAR'
  });
  expect(converted.json.animations![0].channels[0].target).toEqual({node: 0, path: 'translation'});
  expect(converted.json.animations![0]).not.toHaveProperty('parameters');
});

test('glTF 1 animation sampler and parameter names cannot collide with object prototypes', () => {
  const source = createGLTFV1ConformanceAsset();
  const animation = (source.json as any).animations.animation;
  animation.parameters = Object.fromEntries([
    ['__proto__', 'time'],
    ['VALUE', 'translation']
  ]);
  animation.samplers = Object.fromEntries([['__proto__', {input: '__proto__', output: 'VALUE'}]]);
  animation.channels[0].sampler = '__proto__';
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  expect(converted.json.animations![0].samplers[0].input).toBe(3);
  expect(converted.json.animations![0].channels[0].sampler).toBe(0);
});

test.each([
  {field: 'input', value: 'missing', message: 'unresolved accessor'},
  {field: 'input', value: 'constructor', message: 'unresolved accessor'},
  {field: 'channel', value: 'missing', message: 'unresolved sampler'}
])('glTF 1 preserves invalid animation $field references in best-effort mode', ({
  field,
  value,
  message
}) => {
  const source = createGLTFV1ConformanceAsset();
  const animation = (source.json as any).animations.animation;
  if (field === 'input') animation.samplers.sampler.input = value;
  else animation.channels[0].sampler = value;
  const converted = convertGLTFV1ToGLTF2(source);
  expect(converted.normalizationReport.unsupported.some(feature => feature.includes(message))).toBe(
    true
  );
  expect(
    field === 'input'
      ? converted.json.animations![0].samplers[0].input
      : converted.json.animations![0].channels[0].sampler
  ).toBe(value);
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(message);
});

test.each([
  {times: [0, 0]},
  {times: [1, 0]},
  {times: [-1, 1]},
  {times: [0, Infinity]},
  {times: [0, NaN]}
])('glTF 1 does not reorder or sanitize invalid animation times $times', ({times}) => {
  const source = createGLTFV1ConformanceAsset();
  const data = new DataView(source.buffers[0].arrayBuffer);
  times.forEach((time, index) => data.setFloat32(63 + index * 4, time, true));
  const bytes = new Uint8Array(source.buffers[0].arrayBuffer).slice();
  expect(
    convertGLTFV1ToGLTF2(source).normalizationReport.unsupported.some(feature =>
      feature.includes('strictly increasing')
    )
  ).toBe(true);
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow('strictly increasing');
  expect(new Uint8Array(source.buffers[0].arrayBuffer)).toEqual(bytes);
});

test.each([
  {
    label: 'time shape',
    change: (json: any) => (json.accessors.time.type = 'VEC2'),
    message: 'time input'
  },
  {
    label: 'output count',
    change: (json: any) => (json.accessors.translation.count = 1),
    message: 'output shape'
  },
  {
    label: 'output type',
    change: (json: any) => (json.accessors.translation.componentType = 5123),
    message: 'output shape'
  },
  {
    label: 'normalized output',
    change: (json: any) => (json.accessors.translation.normalized = true),
    message: 'output shape'
  },
  {
    label: 'unsupported interpolation',
    change: (json: any) =>
      (json.animations.animation.samplers.sampler.interpolation = 'CUBICSPLINE'),
    message: 'unsupported interpolation'
  },
  {
    label: 'empty interpolation',
    change: (json: any) => (json.animations.animation.samplers.sampler.interpolation = ''),
    message: 'unsupported interpolation'
  },
  {
    label: 'conflicting matrix node',
    change: (json: any) =>
      (json.nodes.root.matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
    message: 'conflicting TRS'
  },
  {
    label: 'duplicate target',
    change: (json: any) =>
      json.animations.animation.channels.push({...json.animations.animation.channels[0]}),
    message: 'duplicate node/path'
  },
  {
    label: 'unknown target',
    change: (json: any) => (json.animations.animation.channels[0].target.path = 'weights'),
    message: 'TRS target'
  },
  {
    label: 'non-finite output',
    change: (json: any, data: DataView) => data.setFloat32(71, Infinity, true),
    message: 'finite values'
  },
  {
    label: 'missing node',
    change: (json: any) => (json.animations.animation.channels[0].target.id = 'missing'),
    message: 'unresolved node'
  }
])('glTF 1 reports animation $label', ({change, message}) => {
  const source = createGLTFV1ConformanceAsset();
  change(source.json, new DataView(source.buffers[0].arrayBuffer));
  expect(
    convertGLTFV1ToGLTF2(source).normalizationReport.unsupported.some(feature =>
      feature.includes(message)
    )
  ).toBe(true);
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(message);
});

test.each([
  1, 2
])('glTF 1 checks rotation quaternion norm %s without inventing a replacement rotation', magnitude => {
  const source = createGLTFV1ConformanceAsset();
  const json = source.json as any;
  json.accessors.translation.type = 'VEC4';
  json.animations.animation.channels[0].target.path = 'rotation';
  const values = [0, 0, 0, magnitude, 0, 0, 0, 1];
  const data = new DataView(source.buffers[0].arrayBuffer);
  values.forEach((value, index) => data.setFloat32(71 + index * 4, value, true));
  if (magnitude === 1)
    expect(
      convertGLTFV1ToGLTF2(source, {normalize: 'strict'}).normalizationReport.unsupported
    ).toEqual([]);
  else
    expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(
      'unit rotation quaternions'
    );
});
