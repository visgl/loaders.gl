// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {GLTFWithBuffers, GLTFPostprocessed} from '@loaders.gl/gltf';
import {postProcessGLTF} from '@loaders.gl/gltf';
const TEST_CASES: {
  name: string;
  input: GLTFWithBuffers;
  output: Partial<GLTFPostprocessed>;
}[] = [
  {
    name: 'Simple scene',
    input: {
      json: {
        asset: {version: '2.0'},
        scenes: [
          {
            nodes: [0, 1]
          }
        ],
        nodes: [{mesh: 0}, {mesh: 1}],
        meshes: [{primitives: []}, {primitives: []}],
        buffers: []
      },
      buffers: []
    },
    output: {
      asset: {version: '2.0'},
      scenes: [
        {
          nodes: [
            {mesh: {id: 'mesh-0', primitives: []}, id: 'node-0'},
            {mesh: {id: 'mesh-1', primitives: []}, id: 'node-1'}
          ],
          id: 'scene-0'
        }
      ],
      nodes: [
        {mesh: {id: 'mesh-0', primitives: []}, id: 'node-0'},
        {mesh: {id: 'mesh-1', primitives: []}, id: 'node-1'}
      ],
      meshes: [
        {id: 'mesh-0', primitives: []},
        {id: 'mesh-1', primitives: []}
      ],
      buffers: []
    }
  }
];
test('gltf#postProcessGLTF', () => {
  for (const testCase of TEST_CASES) {
    const json = postProcessGLTF(testCase.input as unknown as GLTFWithBuffers);
    expect(json, testCase.name).toEqual(testCase.output);
  }
});
test('gltf#postProcessGLTF resolves a draft glTF 2.1 thumbnail', () => {
  const json = postProcessGLTF({
    json: {
      asset: {version: '2.1', thumbnail: 0},
      images: [{uri: 'thumbnail.png'}]
    },
    buffers: [],
    images: [{width: 2, height: 2}]
  } as unknown as GLTFWithBuffers);
  expect(json.asset.thumbnail, 'resolves the thumbnail to the processed image').toBe(
    json.images[0]
  );
  expect(json.asset.thumbnail?.image.width, 'preserves the decoded thumbnail image').toBe(2);
});
test('gltf#postProcessGLTF normalizes indexed LINE_LOOP topology without mutating source data', () => {
  const sourceIndices = new Uint16Array([3, 1, 4, 2]);
  const source = {
    json: {
      asset: {version: '2.0'},
      buffers: [{byteLength: sourceIndices.byteLength}],
      bufferViews: [{buffer: 0, byteLength: sourceIndices.byteLength}],
      accessors: [
        {bufferView: 0, componentType: 5123, count: sourceIndices.length, type: 'SCALAR'},
        {componentType: 5126, count: 5, type: 'VEC3'}
      ],
      meshes: [{primitives: [{attributes: {POSITION: 1}, indices: 0, mode: 2}]}]
    },
    buffers: [
      {
        arrayBuffer: sourceIndices.buffer,
        byteOffset: 0,
        byteLength: sourceIndices.byteLength
      }
    ]
  } as GLTFWithBuffers;
  const json = postProcessGLTF(source);
  const primitive = json.meshes[0].primitives[0];
  expect(primitive.mode, 'converts LINE_LOOP to LINES').toBe(1);
  expect(
    Array.from(primitive.indices?.value || []),
    'expands the loop into line-list indices'
  ).toEqual([3, 1, 1, 4, 4, 2, 2, 3]);
  expect(primitive.indices?.componentType, 'uses portable unsigned-short indices').toBe(5123);
  expect(source.json.meshes?.[0].primitives[0].mode, 'preserves the source primitive mode').toBe(2);
  expect(source.json.accessors?.[0].count, 'preserves the source index accessor').toBe(4);
  expect(Array.from(sourceIndices), 'preserves the source index buffer').toEqual([3, 1, 4, 2]);
});
test('gltf#postProcessGLTF normalizes non-indexed TRIANGLE_FAN topology', () => {
  const json = postProcessGLTF({
    json: {
      asset: {version: '2.0'},
      accessors: [{componentType: 5126, count: 4, type: 'VEC3'}],
      meshes: [{primitives: [{attributes: {POSITION: 0}, mode: 6}]}]
    },
    buffers: []
  } as GLTFWithBuffers);
  const primitive = json.meshes[0].primitives[0];
  expect(primitive.mode, 'converts TRIANGLE_FAN to TRIANGLES').toBe(4);
  expect(
    Array.from(primitive.indices?.value || []),
    'expands the fan into triangle-list indices'
  ).toEqual([0, 1, 2, 0, 2, 3]);
  expect(primitive.indices?.count, 'updates the generated index count').toBe(6);
  expect(primitive.indices?.max?.[0], 'records the generated maximum index').toBe(3);
});
test('gltf#postProcessGLTF materializes an implicit-zero index accessor', () => {
  const json = postProcessGLTF({
    json: {
      asset: {version: '2.0'},
      accessors: [
        {componentType: 5123, count: 3, type: 'SCALAR'},
        {componentType: 5126, count: 1, type: 'VEC3'}
      ],
      meshes: [{primitives: [{attributes: {POSITION: 1}, indices: 0, mode: 2}]}]
    },
    buffers: []
  } as GLTFWithBuffers);
  const primitive = json.meshes[0].primitives[0];
  expect(primitive.mode, 'converts LINE_LOOP to LINES').toBe(1);
  expect(
    Array.from(primitive.indices?.value || []),
    'uses the accessor implicit-zero values'
  ).toEqual([0, 0, 0, 0, 0, 0]);
});
test('gltf#postProcessGLTF applies sparse-only index accessor substitutions', () => {
  const sparseData = new Uint8Array([1, 3, 5, 0, 2, 0]);
  const json = postProcessGLTF({
    json: {
      asset: {version: '2.0'},
      buffers: [{byteLength: sparseData.byteLength}],
      bufferViews: [
        {buffer: 0, byteOffset: 0, byteLength: 2},
        {buffer: 0, byteOffset: 2, byteLength: 4}
      ],
      accessors: [
        {
          componentType: 5123,
          count: 4,
          type: 'SCALAR',
          sparse: {
            count: 2,
            indices: {bufferView: 0, componentType: 5121},
            values: {bufferView: 1}
          }
        },
        {componentType: 5126, count: 6, type: 'VEC3'}
      ],
      meshes: [{primitives: [{attributes: {POSITION: 1}, indices: 0, mode: 2}]}]
    },
    buffers: [{arrayBuffer: sparseData.buffer, byteOffset: 0, byteLength: sparseData.byteLength}]
  } as GLTFWithBuffers);
  const primitive = json.meshes[0].primitives[0];
  expect(primitive.mode, 'converts LINE_LOOP to LINES').toBe(1);
  expect(
    Array.from(primitive.indices?.value || []),
    'applies sparse substitutions to the implicit-zero base'
  ).toEqual([0, 5, 5, 0, 0, 2, 2, 0]);
});

test('gltf#postProcessGLTF resolves the complete scene, material, texture, and skin graph', () => {
  const bytes = new Uint8Array(64);
  new Float32Array(bytes.buffer, 8, 6).set([1, 2, 3, 4, 5, 6]);
  const json = postProcessGLTF({
    baseUri: 'https://example.com/models/',
    json: {
      asset: {version: '2.0'},
      buffers: [{byteLength: bytes.byteLength}],
      bufferViews: [
        {buffer: 0, byteOffset: 8, byteLength: 24, byteStride: 12},
        {buffer: 0, byteOffset: 0, byteLength: 8}
      ],
      accessors: [
        {bufferView: 0, componentType: 5126, count: 2, type: 'VEC3'},
        {componentType: 5123, count: 2, type: 'SCALAR'}
      ],
      images: [{bufferView: 1, mimeType: 'image/png'}, {uri: 'fallback.png'}],
      samplers: [{magFilter: 9728, minFilter: 9984, wrapS: 33071, wrapT: 33648}],
      textures: [{sampler: 0, source: 0}, {source: 1}, {}],
      materials: [
        {
          normalTexture: {index: 0},
          occlusionTexture: {index: 0},
          emissiveTexture: {index: 1},
          pbrMetallicRoughness: {
            baseColorTexture: {index: 0},
            metallicRoughnessTexture: {index: 1}
          }
        },
        {}
      ],
      meshes: [
        {primitives: [{attributes: {POSITION: 0}, indices: 1, material: 0, mode: 4}]},
        {id: 'second', primitives: []}
      ],
      cameras: [{type: 'perspective', perspective: {yfov: 1, znear: 0.1}}],
      skins: [{inverseBindMatrices: 1, joints: [0]}],
      nodes: [{mesh: 0, camera: 0, skin: 0, children: [1]}, {meshes: [0, 1] as any}],
      scenes: [{nodes: [0]}],
      scene: 0
    },
    buffers: [{arrayBuffer: bytes.buffer, byteOffset: 0, byteLength: bytes.byteLength}],
    images: [{width: 4, height: 2}]
  } as unknown as GLTFWithBuffers);

  expect(Array.from(json.accessors[0].value)).toEqual([1, 2, 3, 4, 5, 6]);
  expect(json.images[0].image).toEqual({width: 4, height: 2});
  expect(json.images[1].image).toBeNull();
  expect(json.textures[0].sampler.parameters).toMatchObject({
    10240: 9728,
    10241: 9984,
    10242: 33071,
    10243: 33648
  });
  expect(json.textures[1].sampler.id).toBe('default-sampler');
  expect(json.textures[2].source).toBeUndefined();
  expect(json.materials[0].emissiveFactor).toEqual([1, 1, 1]);
  expect(json.materials[1].emissiveFactor).toEqual([0, 0, 0]);
  expect(json.materials[0].normalTexture?.texture).toBe(json.textures[0]);
  expect(json.nodes[0].children?.[0]).toBe(json.nodes[1]);
  expect(json.nodes[1].mesh?.primitives).toHaveLength(1);
  expect(json.skins[0].inverseBindMatrices).toBe(json.accessors[1]);
  expect(json.scene).toBe(json.scenes[0]);
});

test('gltf#postProcessGLTF covers portable topology size boundaries', () => {
  const emptyLoop = postProcessGLTF({
    json: {
      asset: {version: '2.0'},
      accessors: [{componentType: 5126, count: 1, type: 'VEC3'}],
      meshes: [{primitives: [{attributes: {POSITION: 0}, mode: 2}]}]
    },
    buffers: []
  } as GLTFWithBuffers).meshes[0].primitives[0];
  expect(emptyLoop.indices?.value).toHaveLength(0);
  expect(emptyLoop.indices?.min).toBeUndefined();

  const largeFan = postProcessGLTF({
    json: {
      asset: {version: '2.0'},
      accessors: [{componentType: 5126, count: 65_537, type: 'VEC3'}],
      meshes: [{primitives: [{attributes: {POSITION: 0}, mode: 6}]}]
    },
    buffers: []
  } as GLTFWithBuffers).meshes[0].primitives[0];
  expect(largeFan.indices?.value).toBeInstanceOf(Uint32Array);
  expect(largeFan.indices?.componentType).toBe(5125);
  expect(largeFan.indices?.max).toEqual([65_536]);
});

test('gltf#postProcessGLTF validates sparse index types, ranges, and byte lengths', () => {
  const makeSparseSource = (componentType: number, index: number, valueByteLength = 4) => {
    const bytes = new Uint8Array([index, 0, 0, 0, 9, 0, 0, 0]);
    return {
      json: {
        asset: {version: '2.0'},
        buffers: [{byteLength: bytes.byteLength}],
        bufferViews: [
          {buffer: 0, byteLength: 4},
          {buffer: 0, byteOffset: 4, byteLength: valueByteLength}
        ],
        accessors: [
          {
            componentType: 5125,
            count: 2,
            type: 'SCALAR',
            sparse: {
              count: 1,
              indices: {bufferView: 0, componentType},
              values: {bufferView: 1}
            }
          }
        ]
      },
      buffers: [{arrayBuffer: bytes.buffer, byteOffset: 0, byteLength: bytes.byteLength}]
    } as unknown as GLTFWithBuffers;
  };

  expect(() => postProcessGLTF(makeSparseSource(5122, 0))).toThrow(/Invalid glTF sparse index/);
  expect(() => postProcessGLTF(makeSparseSource(5121, 4))).toThrow(/out of bounds/);
  expect(() => postProcessGLTF(makeSparseSource(5121, 0, 2))).toThrow(/exceeds its buffer view/);
});
