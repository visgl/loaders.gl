// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Matrix4} from '@math.gl/core';
import {convertGLTFV1ToGLTF2} from '@loaders.gl/gltf';
import {createGLTFV1ConformanceAsset} from '../../test-utils/create-gltf-v1-conformance';

test.each([
  {rotation: [0, 0, 0, 1], scale: [2, 3, 4]},
  {rotation: [1, 0, 0, 0], scale: [2, 3, 4]},
  {rotation: [0, 1, 0, 0], scale: [2, 3, 4]},
  {rotation: [0, 0, 1, 0], scale: [2, 3, 4]},
  {rotation: [0, 0, Math.SQRT1_2, Math.SQRT1_2], scale: [-2, 3, 4]},
  {rotation: [0, 0, Math.SQRT1_2, Math.SQRT1_2], scale: [-2, -3, 4]}
])('glTF 1 decomposes translation-only matrix animation with $rotation and $scale', ({
  rotation,
  scale
}) => {
  const source = createGLTFV1ConformanceAsset();
  const json = source.json as any;
  const matrix = Array.from(
    new Matrix4()
      .translate([7, 8, 9])
      .multiplyRight(new Matrix4().fromQuaternion(rotation))
      .scale(scale)
  );
  json.nodes.root.matrix = matrix;
  delete json.nodes.root.translation;
  const originalJson = JSON.stringify(json);
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  const node = converted.json.nodes![0];
  expect(node.matrix).toBeUndefined();
  expect(node.translation).toEqual([7, 8, 9]);
  expect(Math.hypot(...node.rotation!)).toBeCloseTo(1, 12);
  const reconstructed = new Matrix4()
    .translate(node.translation!)
    .multiplyRight(new Matrix4().fromQuaternion(node.rotation!))
    .scale(node.scale!);
  matrix.forEach((value, index) => expect(reconstructed[index]).toBeCloseTo(value, 10));
  // Replacing translation keys leaves the original rotation/scale basis unchanged.
  const animated = new Matrix4()
    .translate([1, 2, 3])
    .multiplyRight(new Matrix4().fromQuaternion(node.rotation!))
    .scale(node.scale!);
  expect(Array.from(animated).slice(0, 12)).toEqual(Array.from(reconstructed).slice(0, 12));
  expect(converted.normalizationReport.unsupported).toEqual([]);
  expect(
    converted.normalizationReport.warnings.some(message => message.includes('Decomposed'))
  ).toBe(true);
  expect(JSON.stringify(json)).toBe(originalJson);
});

test.each([
  {label: 'shear', component: 4, value: 0.2},
  {label: 'zero scale', component: 0, value: 0},
  {label: 'perspective', component: 3, value: 0.01},
  {label: 'non-finite', component: 0, value: Infinity},
  {label: 'short matrix', component: -1, value: 0}
])('glTF 1 retains and diagnoses $label animated matrices', ({component, value}) => {
  const source = createGLTFV1ConformanceAsset();
  const json = source.json as any;
  const matrix = Array.from(new Matrix4());
  if (component < 0) matrix.pop();
  else matrix[component] = value;
  json.nodes.root.matrix = matrix;
  delete json.nodes.root.translation;
  const converted = convertGLTFV1ToGLTF2(source);
  expect(converted.json.nodes![0].matrix).toEqual(
    component === 0 && !Number.isFinite(value)
      ? matrix.map(number => (Number.isFinite(number) ? number : null))
      : matrix
  );
  expect(
    converted.normalizationReport.unsupported.some(message => message.includes('without shear'))
  ).toBe(true);
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow('without shear');
});

test.each([
  'rotation',
  'scale',
  'another animation',
  'TRS fields',
  'extensions'
])('glTF 1 does not guess the matrix basis for %s', condition => {
  const source = createGLTFV1ConformanceAsset();
  const json = source.json as any;
  json.nodes.root.matrix = Array.from(new Matrix4());
  delete json.nodes.root.translation;
  if (condition === 'TRS fields') json.nodes.root.scale = [1, 1, 1];
  else if (condition === 'extensions') json.nodes.root.extensions = {custom: {}};
  else if (condition === 'another animation') {
    json.animations.second = structuredClone(json.animations.animation);
    json.animations.second.channels[0].target.path = 'scale';
  } else json.animations.animation.channels[0].target.path = condition;
  const converted = convertGLTFV1ToGLTF2(source);
  expect(converted.json.nodes![0].matrix).toEqual(Array.from(new Matrix4()));
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(/animated matrix node/);
});

test('glTF 1 leaves unanimated matrix nodes unchanged', () => {
  const source = createGLTFV1ConformanceAsset();
  (source.json as any).nodes.child.matrix = Array.from(new Matrix4());
  expect(convertGLTFV1ToGLTF2(source, {normalize: 'strict'}).json.nodes![1].matrix).toEqual(
    Array.from(new Matrix4())
  );
});
