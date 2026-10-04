// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {convertGLTFV1ToGLTF2} from '@loaders.gl/gltf';
import type {GLTFWithBuffers} from '../../../src/lib/types/gltf-types';
import {createGLTFV1ConformanceAsset} from '../../test-utils/create-gltf-v1-conformance';

/** Exact identity leaves supplied inverse-bind data eligible for independent validation. */
const IDENTITY_MATRIX = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

test('glTF 1 resolves multiple roots through their common ancestor and attaches it once per scene', () => {
  const source = createMultiRootAsset();
  const json = source.json as any;
  json.nodes.sameInstance = {...json.nodes.instance};
  json.scenes.scene.nodes.push('sameInstance');
  json.scenes.second = {nodes: ['instance']};
  const originalJson = JSON.stringify(json);
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  const commonIndex = converted.json.nodes!.findIndex(node => node.id === 'common');
  expect(converted.json.skins).toHaveLength(1);
  expect(converted.json.skins![0]).toMatchObject({joints: [0, 1], skeleton: commonIndex});
  expect(converted.json.nodes![commonIndex]).toMatchObject({
    translation: [5, 6, 7],
    children: [0, 1]
  });
  expect(converted.json.scenes![0].nodes!.filter(index => index === commonIndex)).toHaveLength(1);
  expect(converted.json.scenes![1].nodes).toEqual([2, commonIndex]);
  expect(converted.json.nodes![2]).not.toHaveProperty('skeletons');
  expect(converted.normalizationReport.unsupported).toEqual([]);
  expect(JSON.stringify(json)).toBe(originalJson);
});

test('glTF 1 scopes repeated names to each multi-root instance while preserving palette order', () => {
  const source = createMultiRootAsset();
  const json = source.json as any;
  json.skins.skin.jointNames = ['child', 'root'];
  json.nodes.otherRoot = {jointName: 'root'};
  json.nodes.otherChild = {jointName: 'child'};
  json.nodes.otherCommon = {children: ['otherRoot', 'otherChild']};
  json.nodes.otherInstance = {
    skin: 'skin',
    meshes: ['mesh'],
    skeletons: ['otherRoot', 'otherChild']
  };
  json.scenes.scene.nodes.push('otherInstance');
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  expect(converted.json.skins).toMatchObject([
    {joints: [1, 0], skeleton: 3},
    {joints: [5, 4], skeleton: 6}
  ]);
  expect(converted.json.nodes![7].skin).toBe(1);
  expect(converted.json.scenes![0].nodes!.slice(0, 2)).toEqual([2, 7]);
  expect(converted.json.scenes![0].nodes!.slice(2).sort()).toEqual([3, 6]);
});

test.each([
  'disconnected',
  'duplicate roots',
  'overlap',
  'ambiguous name',
  'cyclic',
  'renderable ancestor'
])('glTF 1 diagnoses unsafe multi-root binding: %s', condition => {
  const source = createMultiRootAsset();
  const json = source.json as any;
  if (condition === 'disconnected') delete json.nodes.common;
  else if (condition === 'duplicate roots') json.nodes.instance.skeletons = ['root', 'root'];
  else if (condition === 'overlap') json.nodes.root.children = ['child'];
  else if (condition === 'ambiguous name') json.nodes.child.jointName = 'root';
  else if (condition === 'cyclic') json.nodes.root.children = ['common'];
  else json.nodes.common.meshes = ['mesh'];
  expect(convertGLTFV1ToGLTF2(source).normalizationReport.unsupported.length).toBeGreaterThan(0);
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow();
});

test.each([
  undefined,
  IDENTITY_MATRIX
])('glTF 1 validates inverse-bind data independently of bind shape %j', bindShapeMatrix => {
  const source = createInverseBindAsset();
  (source.json as any).skins.skin.bindShapeMatrix = bindShapeMatrix;
  expect(
    convertGLTFV1ToGLTF2(source, {normalize: 'strict'}).normalizationReport.unsupported
  ).toEqual([]);
});

test.each([
  {
    label: 'shape',
    change: (json: any) => (json.accessors.matrices.type = 'VEC4'),
    message: 'FLOAT MAT4'
  },
  {
    label: 'component type',
    change: (json: any) => (json.accessors.matrices.componentType = 5123),
    message: 'FLOAT MAT4'
  },
  {
    label: 'normalized',
    change: (json: any) => (json.accessors.matrices.normalized = true),
    message: 'FLOAT MAT4'
  },
  {
    label: 'too few',
    change: (json: any) => (json.accessors.matrices.count = 1),
    message: 'per joint'
  },
  {
    label: 'non-finite',
    change: (json: any, source: GLTFWithBuffers) =>
      new DataView(source.buffers[1].arrayBuffer).setFloat32(64, Infinity, true),
    message: 'finite affine'
  },
  {
    label: 'non-affine',
    change: (json: any, source: GLTFWithBuffers) =>
      new DataView(source.buffers[1].arrayBuffer).setFloat32(12, 1, true),
    message: 'finite affine'
  },
  {
    label: 'missing buffer',
    change: (json: any, source: GLTFWithBuffers) => source.buffers.pop(),
    message: 'loaded'
  },
  {
    label: 'extension',
    change: (json: any) => (json.accessors.matrices.extensions = {custom: {}}),
    message: 'extension-bearing'
  },
  {
    label: 'missing influences',
    change: (json: any) => {
      delete json.meshes.mesh.primitives[0].attributes.JOINT;
      delete json.meshes.mesh.primitives[0].attributes.WEIGHT;
    },
    message: 'requires JOINTS_0'
  }
])('glTF 1 diagnoses skin $label with an identity bind shape', ({change, message}) => {
  const source = createInverseBindAsset();
  const json = source.json as any;
  json.skins.skin.bindShapeMatrix = IDENTITY_MATRIX;
  change(json, source);
  expect(
    convertGLTFV1ToGLTF2(source).normalizationReport.unsupported.some(feature =>
      feature.includes(message)
    )
  ).toBe(true);
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(message);
});

test('glTF 1 accepts surplus inverse-bind matrices and checks unused skins', () => {
  const source = createInverseBindAsset();
  const json = source.json as any;
  json.skins.skin.jointNames = ['root'];
  // Keep both influence values within the smaller palette.
  const data = new DataView(source.buffers[0].arrayBuffer);
  data.setFloat32(35, 0, true);
  data.setFloat32(39, 0, true);
  // Avoid duplicate weighted joints by giving only the first slot a weight.
  data.setFloat32(47, 1, true);
  data.setFloat32(51, 0, true);
  expect(
    convertGLTFV1ToGLTF2(source, {normalize: 'strict'}).normalizationReport.unsupported
  ).toEqual([]);
  delete json.nodes.instance.skin;
  new DataView(source.buffers[1].arrayBuffer).setFloat32(64, Infinity, true);
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow('finite affine');
});

/** Two disjoint named subtrees share a non-joint ancestor with a non-default transform. */
function createMultiRootAsset(): GLTFWithBuffers {
  const source = createGLTFV1ConformanceAsset();
  const json = source.json as any;
  delete json.nodes.root.children;
  json.nodes.common = {children: ['root', 'child'], translation: [5, 6, 7]};
  json.nodes.instance.skeletons = ['root', 'child'];
  return source;
}

/** Add two packed, finite inverse-bind matrices to the existing tiny skin fixture. */
function createInverseBindAsset(): GLTFWithBuffers {
  const source = createGLTFV1ConformanceAsset();
  const json = source.json as any;
  const arrayBuffer = new Float32Array([...IDENTITY_MATRIX, ...IDENTITY_MATRIX]).buffer;
  json.buffers.bind = {byteLength: 128};
  json.bufferViews.bind = {buffer: 'bind', byteLength: 128};
  json.accessors.matrices = {bufferView: 'bind', componentType: 5126, type: 'MAT4', count: 2};
  json.skins.skin.inverseBindMatrices = 'matrices';
  source.buffers.push({arrayBuffer, byteOffset: 0, byteLength: 128});
  return source;
}
