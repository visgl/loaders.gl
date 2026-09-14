// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {describe, expect, test} from 'vitest';
import type {
  GLTF_EXT_mesh_polygon,
  GLTFPrimitiveRestartData,
  GLTFWithBuffers
} from '@loaders.gl/gltf';
import {decodeExtensions} from '../../../src/lib/api/gltf-extensions';

describe('draft vector topology extensions', () => {
  test('decodes primitive-restart ranges without copying indices', async () => {
    const gltf = createPrimitiveRestartGLTF();

    await decodeExtensions(gltf, {gltf: {loadBuffers: true}});

    const restart = gltf.json.meshes?.[0].primitives[0]
      .primitiveRestart as GLTFPrimitiveRestartData;
    expect(gltf.json.meshes?.[0].primitives[0].indices).toBe(0);
    expect(restart.restartIndex).toBe(65535);
    expect(restart.ranges).toEqual([
      {offset: 0, count: 2},
      {offset: 3, count: 3}
    ]);
    expect(JSON.stringify(gltf.json)).not.toContain('primitiveRestart');
  });

  test('requires primitive restart to be declared as required', async () => {
    const gltf = createPrimitiveRestartGLTF();
    gltf.json.extensionsRequired = [];

    await expect(decodeExtensions(gltf, {gltf: {loadBuffers: true}})).rejects.toThrow(
      'extensionsRequired'
    );
  });

  test('rejects restart markers in unsupported primitive modes', async () => {
    const gltf = createPrimitiveRestartGLTF();
    gltf.json.meshes![0].primitives[0].mode = 4;

    await expect(decodeExtensions(gltf, {gltf: {loadBuffers: true}})).rejects.toThrow(
      'not valid for mode 4'
    );
  });

  test('ignores restart decoding when buffers are not loaded', async () => {
    const gltf = createPrimitiveRestartGLTF();

    await decodeExtensions(gltf, {gltf: {loadBuffers: false}});

    expect(gltf.json.meshes?.[0].primitives[0].primitiveRestart).toBeUndefined();
  });

  test('validates restart accessor references and formats', async () => {
    const missingAccessor = createPrimitiveRestartGLTF();
    missingAccessor.json.meshes![0].primitives[0].indices = 1;
    await expect(decodeExtensions(missingAccessor, {gltf: {loadBuffers: true}})).rejects.toThrow(
      'missing indices accessor 1'
    );

    const invalidType = createPrimitiveRestartGLTF();
    invalidType.json.accessors![0].type = 'VEC2';
    await expect(decodeExtensions(invalidType, {gltf: {loadBuffers: true}})).rejects.toThrow(
      'must have SCALAR type'
    );

    const invalidComponent = createPrimitiveRestartGLTF();
    invalidComponent.json.accessors![0].componentType = 5122;
    await expect(decodeExtensions(invalidComponent, {gltf: {loadBuffers: true}})).rejects.toThrow(
      'must use an unsigned integer component type'
    );
  });

  test('leaves unindexed and restart-free unsupported primitives unchanged', async () => {
    const unindexed = createPrimitiveRestartGLTF();
    delete unindexed.json.meshes![0].primitives[0].indices;
    await decodeExtensions(unindexed, {gltf: {loadBuffers: true}});
    expect(unindexed.json.meshes![0].primitives[0].primitiveRestart).toBeUndefined();

    const triangles = createPrimitiveRestartGLTF(new Uint16Array([0, 1, 2]));
    triangles.json.meshes![0].primitives[0].mode = 4;
    await decodeExtensions(triangles, {gltf: {loadBuffers: true}});
    expect(triangles.json.meshes![0].primitives[0].primitiveRestart).toBeUndefined();
  });

  test.each([
    [new Uint8Array([0, 255, 1]), 5121, 255],
    [new Uint32Array([0, 0xffffffff, 1]), 5125, 0xffffffff]
  ])('supports each restart component width', async (data, componentType, restartIndex) => {
    const gltf = createPrimitiveRestartGLTF(data, componentType);

    await decodeExtensions(gltf, {gltf: {loadBuffers: true}});

    expect(gltf.json.meshes![0].primitives[0].primitiveRestart?.restartIndex).toBe(restartIndex);
  });

  test('decodes polygon triangle and loop topology', async () => {
    const gltf = createPolygonGLTF();

    await decodeExtensions(gltf, {gltf: {loadBuffers: true}});

    const extension = gltf.json.meshes?.[0].primitives[0].extensions
      ?.EXT_mesh_polygon as GLTF_EXT_mesh_polygon;
    expect(Array.from(extension.data!.indicesOffsets)).toEqual([0, 6]);
    expect(Array.from(extension.data!.loopIndicesOffsets)).toEqual([0, 10]);
    expect(extension.data!.polygons).toEqual([
      {
        triangleRange: {offset: 0, count: 6},
        loopRanges: [
          {offset: 0, count: 4},
          {offset: 5, count: 4}
        ]
      },
      {
        triangleRange: {offset: 6, count: 3},
        loopRanges: [{offset: 10, count: 3}]
      }
    ]);
    expect(JSON.stringify(gltf.json)).not.toContain('"data"');
  });

  test('rejects non-monotonic polygon offsets', async () => {
    const gltf = createPolygonGLTF();
    const buffer = new Uint16Array(gltf.buffers[0].arrayBuffer);
    buffer[10] = 0;

    await expect(decodeExtensions(gltf, {gltf: {loadBuffers: true}})).rejects.toThrow(
      'increasing in-bounds offsets'
    );
  });

  test('rejects malformed polygon accessors', async () => {
    const gltf = createPolygonGLTF();
    gltf.json.accessors![2].type = 'VEC2';

    await expect(decodeExtensions(gltf, {gltf: {loadBuffers: true}})).rejects.toThrow(
      'loopIndices must be an unsigned integer SCALAR accessor'
    );
  });

  test('validates polygon structure and accessor references', async () => {
    const invalidCount = createPolygonGLTF();
    getPolygonExtension(invalidCount).count = 0;
    await expect(decodeExtensions(invalidCount, {gltf: {loadBuffers: true}})).rejects.toThrow(
      'count must be a positive integer'
    );

    const unindexed = createPolygonGLTF();
    delete unindexed.json.meshes![0].primitives[0].indices;
    await expect(decodeExtensions(unindexed, {gltf: {loadBuffers: true}})).rejects.toThrow(
      'must use TRIANGLES mode with indices'
    );

    const invalidReference = createPolygonGLTF();
    getPolygonExtension(invalidReference).loopIndices = -1;
    await expect(decodeExtensions(invalidReference, {gltf: {loadBuffers: true}})).rejects.toThrow(
      'must reference an accessor'
    );

    const missingAccessor = createPolygonGLTF();
    getPolygonExtension(missingAccessor).loopIndices = 99;
    await expect(decodeExtensions(missingAccessor, {gltf: {loadBuffers: true}})).rejects.toThrow(
      'references missing accessor 99'
    );

    const mismatchedCount = createPolygonGLTF();
    getPolygonExtension(mismatchedCount).count = 3;
    await expect(decodeExtensions(mismatchedCount, {gltf: {loadBuffers: true}})).rejects.toThrow(
      'count must equal polygon count 3'
    );
  });

  test('validates polygon triangle and loop boundaries', async () => {
    const incompleteTriangles = createPolygonGLTF();
    incompleteTriangles.json.accessors![0].count = 8;
    await expect(
      decodeExtensions(incompleteTriangles, {gltf: {loadBuffers: true}})
    ).rejects.toThrow('must contain complete triangles');

    const emptyLoop = createPolygonGLTF();
    const emptyLoopBuffer = new Uint16Array(emptyLoop.buffers[0].arrayBuffer);
    emptyLoopBuffer.fill(65535, 11, 21);
    await expect(decodeExtensions(emptyLoop, {gltf: {loadBuffers: true}})).rejects.toThrow(
      'must contain at least one loop'
    );

    const shortLoop = createPolygonGLTF();
    new Uint16Array(shortLoop.buffers[0].arrayBuffer)[13] = 65535;
    await expect(decodeExtensions(shortLoop, {gltf: {loadBuffers: true}})).rejects.toThrow(
      'loops must contain at least three indices'
    );

    const nonzeroStart = createPolygonGLTF();
    new Uint16Array(nonzeroStart.buffers[0].arrayBuffer)[9] = 1;
    await expect(decodeExtensions(nonzeroStart, {gltf: {loadBuffers: true}})).rejects.toThrow(
      'must begin at zero'
    );
  });
});

/** Create a line-strip primitive containing two restart-separated lines. */
function createPrimitiveRestartGLTF(
  data: Uint8Array | Uint16Array | Uint32Array = new Uint16Array([0, 1, 65535, 2, 3, 4]),
  componentType = 5123
): GLTFWithBuffers {
  return {
    json: {
      asset: {version: '2.0'},
      extensionsUsed: ['KHR_mesh_primitive_restart'],
      extensionsRequired: ['KHR_mesh_primitive_restart'],
      buffers: [{byteLength: data.byteLength}],
      bufferViews: [{buffer: 0, byteLength: data.byteLength}],
      accessors: [{bufferView: 0, componentType, count: data.length, type: 'SCALAR'}],
      meshes: [{primitives: [{attributes: {}, indices: 0, mode: 3}]}]
    },
    buffers: [{arrayBuffer: data.buffer, byteOffset: 0, byteLength: data.byteLength}]
  };
}

/** Return the polygon extension from a test fixture. */
function getPolygonExtension(gltf: GLTFWithBuffers): GLTF_EXT_mesh_polygon {
  return gltf.json.meshes![0].primitives[0].extensions!.EXT_mesh_polygon as GLTF_EXT_mesh_polygon;
}

/** Create two polygons, the first containing one interior ring. */
function createPolygonGLTF(): GLTFWithBuffers {
  const triangleIndices = [0, 1, 2, 0, 2, 3, 4, 5, 6];
  const indicesOffsets = [0, 6];
  const loopIndices = [0, 1, 2, 3, 65535, 7, 8, 9, 10, 65535, 4, 5, 6, 65535];
  const loopIndicesOffsets = [0, 10];
  const values = new Uint16Array([
    ...triangleIndices,
    ...indicesOffsets,
    ...loopIndices,
    ...loopIndicesOffsets
  ]);
  const offsets = {
    triangles: 0,
    indicesOffsets: triangleIndices.length * 2,
    loopIndices: (triangleIndices.length + indicesOffsets.length) * 2,
    loopIndicesOffsets: (triangleIndices.length + indicesOffsets.length + loopIndices.length) * 2
  };
  return {
    json: {
      asset: {version: '2.0'},
      extensionsUsed: ['EXT_mesh_polygon'],
      buffers: [{byteLength: values.byteLength}],
      bufferViews: [
        {buffer: 0, byteOffset: offsets.triangles, byteLength: triangleIndices.length * 2},
        {buffer: 0, byteOffset: offsets.indicesOffsets, byteLength: indicesOffsets.length * 2},
        {buffer: 0, byteOffset: offsets.loopIndices, byteLength: loopIndices.length * 2},
        {
          buffer: 0,
          byteOffset: offsets.loopIndicesOffsets,
          byteLength: loopIndicesOffsets.length * 2
        }
      ],
      accessors: [
        {bufferView: 0, componentType: 5123, count: triangleIndices.length, type: 'SCALAR'},
        {bufferView: 1, componentType: 5123, count: indicesOffsets.length, type: 'SCALAR'},
        {bufferView: 2, componentType: 5123, count: loopIndices.length, type: 'SCALAR'},
        {
          bufferView: 3,
          componentType: 5123,
          count: loopIndicesOffsets.length,
          type: 'SCALAR'
        }
      ],
      meshes: [
        {
          primitives: [
            {
              attributes: {},
              indices: 0,
              mode: 4,
              extensions: {
                EXT_mesh_polygon: {
                  count: 2,
                  indicesOffsets: 1,
                  loopIndices: 2,
                  loopIndicesOffsets: 3
                }
              }
            }
          ]
        }
      ]
    },
    buffers: [{arrayBuffer: values.buffer, byteOffset: 0, byteLength: values.byteLength}]
  };
}
