// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {extractGLTFMeshArrowPrimitives} from '@loaders.gl/gltf/mesh-arrow';
import type {GLTFWithBuffers} from '../../../src/lib/types/gltf-types';

describe('extractGLTFMeshArrowPrimitives', () => {
  test('projects indexed geometry without copying dense vertex attributes', () => {
    const {gltf, positions} = makeGLTF();

    const [primitive] = extractGLTFMeshArrowPrimitives(gltf);
    const positionVector = primitive.table.data.getChild('POSITION')!;
    const positionValues = positionVector.data[0].children[0].values;

    expect(positionValues.buffer).toBe(positions.buffer);
    expect(primitive.table.indices?.value).toEqual(new Uint16Array([0, 1]));
    expect(primitive.table.schema.metadata).toMatchObject({topology: 'triangle-list', mode: '4'});
    expect(primitive.attributes.POSITION.normalized).toBe(true);
    expect(primitive.nodePath).toEqual([0, 1]);
    expect(primitive.materialIndex).toBe(2);
    expect(Array.from(primitive.worldMatrix)).toEqual([
      2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 1, 2, 3, 1
    ]);
  });

  test('rejects interleaved accessors instead of silently materializing them', () => {
    const {gltf} = makeGLTF();
    gltf.json.bufferViews![0].byteStride = 16;

    expect(() => extractGLTFMeshArrowPrimitives(gltf)).toThrow(/interleaved/);
  });

  test('rejects sparse accessors instead of silently ignoring replacements', () => {
    const {gltf} = makeGLTF();
    gltf.json.accessors![0].sparse = {
      count: 1,
      indices: {bufferView: 1, componentType: 5121},
      values: {bufferView: 1}
    };

    expect(() => extractGLTFMeshArrowPrimitives(gltf)).toThrow(/sparse/);
  });
});

/** Create a small indexed glTF scene with a translated root and scaled mesh node. */
function makeGLTF(): {gltf: GLTFWithBuffers; positions: Float32Array} {
  const positions = new Float32Array([0, 0, 0, 1, 0, 0]);
  const indices = new Uint16Array([0, 1]);
  const source = new ArrayBuffer(positions.byteLength + indices.byteLength);
  new Float32Array(source, 0, positions.length).set(positions);
  new Uint16Array(source, positions.byteLength, indices.length).set(indices);

  return {
    positions: new Float32Array(source, 0, positions.length),
    gltf: {
      json: {
        asset: {version: '2.0'},
        scenes: [{nodes: [0]}],
        scene: 0,
        nodes: [
          {translation: [1, 2, 3], children: [1]},
          {scale: [2, 2, 2], mesh: 0}
        ],
        meshes: [
          {
            primitives: [
              {
                attributes: {POSITION: 0},
                indices: 1,
                material: 2,
                mode: 4
              }
            ]
          }
        ],
        accessors: [
          {bufferView: 0, componentType: 5126, count: 2, type: 'VEC3', normalized: true},
          {bufferView: 1, componentType: 5123, count: 2, type: 'SCALAR'}
        ],
        bufferViews: [
          {buffer: 0, byteOffset: 0, byteLength: positions.byteLength},
          {buffer: 0, byteOffset: positions.byteLength, byteLength: indices.byteLength}
        ],
        buffers: [{byteLength: source.byteLength}]
      },
      buffers: [{arrayBuffer: source, byteOffset: 0, byteLength: source.byteLength}]
    }
  };
}
