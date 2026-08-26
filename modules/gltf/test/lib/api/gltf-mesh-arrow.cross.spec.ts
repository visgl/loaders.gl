// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {convertGLTFToMeshArrow} from '@loaders.gl/gltf/mesh-arrow';
import type {GLTFWithBuffers} from '../../../src/lib/types/gltf-types';

describe('convertGLTFToMeshArrow', () => {
  test('returns reusable indexed geometry and a separate scene placement', () => {
    const {gltf, positions} = makeGLTF();

    const result = convertGLTFToMeshArrow(gltf);
    const [geometry] = result.geometries;
    const [placement] = result.placements;
    const positionVector = geometry.table.data.getChild('POSITION')!;
    const positionValues = positionVector.data[0].children[0].values;

    expect(positionValues.buffer).toBe(positions.buffer);
    expect(geometry.table.indices?.value).toEqual(new Uint16Array([0, 1]));
    expect(geometry.table.data.getChild('indices')?.get(0)?.toArray()).toEqual(
      new Int32Array([0, 1])
    );
    expect(geometry.table.schema.metadata).toMatchObject({topology: 'triangle-list', mode: '4'});
    expect(geometry.attributes.POSITION.normalized).toBeUndefined();
    expect(geometry).toMatchObject({meshIndex: 0, primitiveIndex: 0, materialIndex: 2});
    expect(geometry.materialized).toBe(false);
    expect(placement).toMatchObject({geometryIndex: 0, nodeIndex: 1, nodePath: [0, 1]});
    expect(Array.from(placement.worldMatrix)).toEqual([
      2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 1, 2, 3, 1
    ]);
  });

  test('stores reused geometry once and emits each placement', () => {
    const {gltf} = makeGLTF();
    gltf.json.scenes![0].nodes!.push(2);
    gltf.json.nodes!.push({mesh: 0, translation: [10, 0, 0]});

    const result = convertGLTFToMeshArrow(gltf);

    expect(result.geometries).toHaveLength(1);
    expect(result.placements).toHaveLength(2);
    expect(result.placements.map(placement => placement.geometryIndex)).toEqual([0, 0]);
    expect(result.placements.map(placement => placement.nodeIndex)).toEqual([1, 2]);
  });

  test('materializes interleaved accessors without changing logical values', () => {
    const gltf = makeInterleavedGLTF();
    const sourceBytes = new Uint8Array(gltf.buffers[0].arrayBuffer).slice();

    const result = convertGLTFToMeshArrow(gltf);
    const [geometry] = result.geometries;

    expect(geometry.materialized).toBe(true);
    expect(geometry.attributes.POSITION.value).toEqual(new Float32Array([0, 0, 0, 1, 2, 3]));
    expect(geometry.attributes.POSITION.value.buffer).not.toBe(gltf.buffers[0].arrayBuffer);
    expect(new Uint8Array(gltf.buffers[0].arrayBuffer)).toEqual(sourceBytes);
  });

  test('preserves quantized component storage and normalization', () => {
    const source = new Uint16Array([0, 32767, 65535, 65535, 32767, 0]);
    const gltf = makeSinglePrimitiveGLTF(source.buffer, {
      accessors: [{bufferView: 0, componentType: 5123, count: 2, type: 'VEC3', normalized: true}],
      bufferViews: [{buffer: 0, byteLength: source.byteLength}]
    });

    const {geometries} = convertGLTFToMeshArrow(gltf);
    const positionValues =
      geometries[0].table.data.getChild('POSITION')!.data[0].children[0].values;

    expect(positionValues).toBeInstanceOf(Uint16Array);
    expect(positionValues.buffer).toBe(source.buffer);
    expect(geometries[0].attributes.POSITION.normalized).toBe(true);
    expect(
      geometries[0].table.schema.fields.find(field => field.name === 'POSITION')?.metadata
    ).toEqual({normalized: 'true'});
    expect(geometries[0].materialized).toBe(false);
  });

  test('preserves metadata on canonical Float32 POSITION fields', () => {
    const {gltf} = makeGLTF();
    gltf.json.accessors![0].byteOffset = 0;
    gltf.json.bufferViews![0].byteStride = 12;

    const {geometries} = convertGLTFToMeshArrow(gltf);

    expect(
      geometries[0].table.schema.fields.find(field => field.name === 'POSITION')?.metadata
    ).toEqual({byteOffset: '0', byteStride: '12'});
  });

  test('accepts supported Float64 accessors', () => {
    const source = new Float64Array([0, 0, 0, 1, 2, 3]);
    const gltf = makeSinglePrimitiveGLTF(source.buffer, {
      accessors: [{bufferView: 0, componentType: 5130, count: 2, type: 'VEC3'}],
      bufferViews: [{buffer: 0, byteLength: source.byteLength}]
    });

    const {geometries} = convertGLTFToMeshArrow(gltf);

    expect(geometries[0].attributes.POSITION.value).toBeInstanceOf(Float64Array);
    expect(geometries[0].attributes.POSITION.value.buffer).toBe(source.buffer);
  });

  test('supports an explicit zero-copy-only policy', () => {
    const gltf = makeInterleavedGLTF();

    expect(() => convertGLTFToMeshArrow(gltf, {accessorLayout: 'zero-copy-only'})).toThrow(
      /accessor 0 is interleaved/
    );
  });

  test('materializes sparse substitutions without mutating glTF JSON or buffers', () => {
    const gltf = makeSparseGLTF();
    const sourceJson = JSON.stringify(gltf.json);
    const sourceBytes = new Uint8Array(gltf.buffers[0].arrayBuffer).slice();

    const result = convertGLTFToMeshArrow(gltf);
    const [geometry] = result.geometries;

    expect(geometry.materialized).toBe(true);
    expect(geometry.attributes.POSITION.value).toEqual(new Float32Array([0, 0, 0, 9, 8, 7]));
    expect(JSON.stringify(gltf.json)).toBe(sourceJson);
    expect(new Uint8Array(gltf.buffers[0].arrayBuffer)).toEqual(sourceBytes);
  });

  test('preserves point-list mode zero', () => {
    const {gltf} = makeGLTF();
    gltf.json.meshes![0].primitives[0].mode = 0;

    const {geometries} = convertGLTFToMeshArrow(gltf);

    expect(geometries[0].table.topology).toBe('point-list');
    expect(geometries[0].table.schema.metadata.mode).toBe('0');
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
            primitives: [{attributes: {POSITION: 0}, indices: 1, material: 2, mode: 4}]
          }
        ],
        accessors: [
          {bufferView: 0, componentType: 5126, count: 2, type: 'VEC3'},
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

/** Create glTF geometry with two VEC3 positions embedded in 16-byte vertex records. */
function makeInterleavedGLTF(): GLTFWithBuffers {
  const source = new Float32Array([0, 0, 0, 99, 1, 2, 3, 88]);
  return makeSinglePrimitiveGLTF(source.buffer, {
    accessors: [{bufferView: 0, componentType: 5126, count: 2, type: 'VEC3'}],
    bufferViews: [{buffer: 0, byteLength: source.byteLength, byteStride: 16}]
  });
}

/** Create glTF geometry with one sparse replacement over packed base positions. */
function makeSparseGLTF(): GLTFWithBuffers {
  const source = new ArrayBuffer(40);
  new Float32Array(source, 0, 6).set([0, 0, 0, 1, 1, 1]);
  new Uint8Array(source, 24, 1)[0] = 1;
  new Float32Array(source, 28, 3).set([9, 8, 7]);

  return makeSinglePrimitiveGLTF(source, {
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 2,
        type: 'VEC3',
        sparse: {
          count: 1,
          indices: {bufferView: 1, componentType: 5121},
          values: {bufferView: 2}
        }
      }
    ],
    bufferViews: [
      {buffer: 0, byteOffset: 0, byteLength: 24},
      {buffer: 0, byteOffset: 24, byteLength: 1},
      {buffer: 0, byteOffset: 28, byteLength: 12}
    ]
  });
}

/** Create a minimal one-node, one-primitive glTF around supplied accessor storage. */
function makeSinglePrimitiveGLTF(
  source: ArrayBuffer,
  binary: {
    accessors: NonNullable<GLTFWithBuffers['json']['accessors']>;
    bufferViews: NonNullable<GLTFWithBuffers['json']['bufferViews']>;
  }
): GLTFWithBuffers {
  return {
    json: {
      asset: {version: '2.0'},
      scenes: [{nodes: [0]}],
      nodes: [{mesh: 0}],
      meshes: [{primitives: [{attributes: {POSITION: 0}, mode: 4}]}],
      accessors: binary.accessors,
      bufferViews: binary.bufferViews,
      buffers: [{byteLength: source.byteLength}]
    },
    buffers: [{arrayBuffer: source, byteOffset: 0, byteLength: source.byteLength}]
  };
}
