// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {convertGLTFV1ToGLTF2} from '@loaders.gl/gltf';
import {createAccessorAsset} from '../../test-utils/create-gltf-v1-accessor';

/** Small FLOAT attribute with explicit point topology, permitting arbitrary attribute counts. */
function createAttributeAsset(semantic: string, type: string, values: number[]) {
  const source = createAccessorAsset({
    accessors: {attribute: {bufferView: 'view', componentType: 5126, type, count: 1}},
    meshes: {mesh: {primitives: [{mode: 0, attributes: {[semantic]: 'attribute'}}]}}
  });
  new Float32Array(source.buffers[0].arrayBuffer, 0, values.length).set(values);
  return source;
}

test.each([
  ['NORMAL', 'VEC3', [0, 0, 1]],
  ['TANGENT', 'VEC4', [1, 0, 0, -1]],
  ['TEXCOORD', 'VEC2', [-2, 3]],
  ['COLOR', 'VEC3', [0, 0.5, 1]],
  ['COLOR', 'VEC4', [0, 0.5, 1, 1]],
  ['WEIGHT', 'VEC4', [1, 0, 0, 0]]
])('valid core %s values remain unchanged', (semantic, type, values) => {
  const source = createAttributeAsset(semantic, type, values);
  const bytes = new Uint8Array(source.buffers[0].arrayBuffer).slice();
  expect(
    convertGLTFV1ToGLTF2(source, {normalize: 'strict'}).normalizationReport.unsupported
  ).toEqual([]);
  expect(new Uint8Array(source.buffers[0].arrayBuffer)).toEqual(bytes);
});

test.each([
  ['NORMAL', 'VEC3', [0, 0, 2]],
  ['NORMAL', 'VEC3', [0, NaN, 1]],
  ['NORMAL', 'VEC2', [1, 0]],
  ['TANGENT', 'VEC4', [1, 0, 0, 0]],
  ['TANGENT', 'VEC4', [2, 0, 0, 1]],
  ['TANGENT', 'VEC3', [1, 0, 0]],
  ['TEXCOORD', 'VEC2', [Infinity, 0]],
  ['TEXCOORD', 'VEC3', [0, 0, 0]],
  ['COLOR', 'VEC2', [0, 1]],
  ['COLOR', 'VEC4', [0, 0, 0, 2]],
  ['WEIGHT', 'VEC4', [-1, 0, 0, 0]]
])('invalid %s shape or values are diagnosed without silently repairing them', (semantic, type, values) => {
  const source = createAttributeAsset(semantic, type, values);
  expect(convertGLTFV1ToGLTF2(source).normalizationReport.unsupported).toEqual(
    expect.arrayContaining([expect.stringContaining('accessor 0')])
  );
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow('accessor 0');
});

test.each([true, 'yes'])('core FLOAT normalization %s is rejected', normalized => {
  const source = createAttributeAsset('NORMAL', 'VEC3', [0, 0, 1]);
  (source.json.accessors as any).attribute.normalized = normalized;
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow('normalization');
});

test.each([
  'COLOR',
  'TEXCOORD',
  'JOINT',
  'WEIGHT'
])('%s sets require zero and consecutive indices', semantic => {
  const source = createAttributeAsset(
    semantic === 'TEXCOORD' ? `${semantic}_1` : `${semantic}_2`,
    semantic === 'TEXCOORD' ? 'VEC2' : 'VEC4',
    [0, 0, 0, 0]
  );
  expect(convertGLTFV1ToGLTF2(source).normalizationReport.unsupported.join(' ')).toContain(
    'sets must be contiguous starting at zero'
  );
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow();
});

test.each([
  [0, 1, true],
  [1, 2, true],
  [2, 2, true],
  [3, 2, true],
  [4, 3, true],
  [5, 3, true],
  [6, 3, true],
  [1, 3, false],
  [2, 1, false],
  [3, 1, false],
  [4, 2, false],
  [5, 2, false],
  [6, 2, false],
  [-1, 3, false],
  [7, 3, false],
  [1.5, 3, false],
  [null, 3, false]
])('mode %s draw count %s validity is %s for indexed and unindexed primitives', (mode, count, valid) => {
  for (const indexed of [false, true]) {
    const source = createAccessorAsset({
      accessors: {
        vertices: {bufferView: 'view', componentType: 5126, type: 'SCALAR', count},
        ...(indexed
          ? {
              indices: {
                bufferView: 'view',
                byteOffset: 32,
                componentType: 5121,
                type: 'SCALAR',
                count
              }
            }
          : {})
      },
      meshes: {
        mesh: {
          primitives: [
            {mode, attributes: {_VERTEX: 'vertices'}, ...(indexed ? {indices: 'indices'} : {})}
          ]
        }
      }
    });
    new Uint8Array(source.buffers[0].arrayBuffer, 32, count).fill(0);
    if (valid)
      expect(
        convertGLTFV1ToGLTF2(source, {normalize: 'strict'}).normalizationReport.unsupported
      ).toEqual([]);
    else expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(/mode/);
  }
});

test('absent mode means triangles; opaque extensions do not imply core topology', () => {
  const source = createAttributeAsset('TEXCOORD', 'VEC2', [0, 0]);
  const primitive = (source.json.meshes as any).mesh.primitives[0];
  delete primitive.mode;
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow('primitive mode 4');
  primitive.extensions = {VENDOR_topology: {}};
  expect(convertGLTFV1ToGLTF2(source).json.meshes![0].primitives[0].extensions).toEqual(
    primitive.extensions
  );
});
