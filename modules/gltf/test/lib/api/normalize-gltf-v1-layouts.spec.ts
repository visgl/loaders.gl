// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {convertGLTFV1ToGLTF2} from '@loaders.gl/gltf';
import type {GLTFWithBuffers} from '../../../src/lib/types/gltf-types';
import {getTypedArrayForAccessor} from '../../../src/lib/gltf-utils/get-typed-array';

test('glTF 1 strides preserve interleaved attributes and packed colors in one source view', () => {
  const source = createLegacyAsset(
    {
      accessors: {
        positions: {
          bufferView: 'view',
          byteOffset: 0,
          byteStride: 24,
          componentType: 5126,
          count: 2,
          type: 'VEC3'
        },
        normals: {
          bufferView: 'view',
          byteOffset: 12,
          byteStride: 24,
          componentType: 5126,
          count: 2,
          type: 'VEC3'
        },
        colors: {
          bufferView: 'view',
          byteOffset: 48,
          byteStride: 0,
          componentType: 5121,
          count: 2,
          type: 'VEC4',
          normalized: true
        }
      },
      meshes: {
        mesh: {
          primitives: [{attributes: {POSITION: 'positions', NORMAL: 'normals', COLOR: 'colors'}}]
        }
      }
    },
    56
  );
  new Float32Array(source.buffers[0].arrayBuffer, 0, 12).set([
    1, 2, 3, 10, 11, 12, 4, 5, 6, 13, 14, 15
  ]);
  new Uint8Array(source.buffers[0].arrayBuffer, 48, 8).set([255, 0, 0, 255, 0, 255, 0, 255]);
  const originalJson = JSON.stringify(source.json);
  const originalBytes = Array.from(new Uint8Array(source.buffers[0].arrayBuffer));
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});

  expect(converted.json.accessors).toMatchObject([
    {bufferView: 1},
    {bufferView: 1},
    {bufferView: 2}
  ]);
  expect(converted.json.bufferViews).toMatchObject([
    {byteLength: 56},
    {byteStride: 24, target: 34962},
    {byteStride: 4, target: 34962}
  ]);
  expect(converted.json.accessors?.every(accessor => !('byteStride' in accessor))).toBe(true);
  expect(Array.from(getTypedArrayForAccessor(converted.json, converted.buffers, 0))).toEqual([
    1, 2, 3, 4, 5, 6
  ]);
  expect(Array.from(getTypedArrayForAccessor(converted.json, converted.buffers, 1))).toEqual([
    10, 11, 12, 13, 14, 15
  ]);
  expect(Array.from(getTypedArrayForAccessor(converted.json, converted.buffers, 2))).toEqual([
    255, 0, 0, 255, 0, 255, 0, 255
  ]);
  expect(converted.normalizationReport.unsupported).toEqual([]);
  expect(JSON.stringify(source.json)).toBe(originalJson);
  expect(Array.from(new Uint8Array(source.buffers[0].arrayBuffer))).toEqual(originalBytes);
});

test('glTF 1 strides split vertex, index, and animation views without changing their values', () => {
  const source = createLegacyAsset(
    {
      accessors: {
        positions: {
          bufferView: 'view',
          byteStride: 16,
          componentType: 5126,
          count: 2,
          type: 'VEC3'
        },
        indices: {
          bufferView: 'view',
          byteOffset: 32,
          byteStride: 2,
          componentType: 5123,
          count: 3,
          type: 'SCALAR'
        },
        time: {
          bufferView: 'view',
          byteOffset: 40,
          byteStride: 4,
          componentType: 5126,
          count: 2,
          type: 'SCALAR'
        },
        translations: {
          bufferView: 'view',
          byteOffset: 48,
          byteStride: 12,
          componentType: 5126,
          count: 2,
          type: 'VEC3'
        }
      },
      meshes: {mesh: {primitives: [{attributes: {POSITION: 'positions'}, indices: 'indices'}]}},
      nodes: {node: {meshes: ['mesh']}},
      animations: {
        animation: {
          parameters: {time: 'time', value: 'translations'},
          samplers: {sampler: {input: 'time', output: 'value'}},
          channels: [{sampler: 'sampler', target: {id: 'node', path: 'translation'}}]
        }
      }
    },
    72
  );
  new Float32Array(source.buffers[0].arrayBuffer, 0, 8).set([1, 2, 3, 99, 4, 5, 6, 99]);
  new Uint16Array(source.buffers[0].arrayBuffer, 32, 3).set([0, 1, 0]);
  new Float32Array(source.buffers[0].arrayBuffer, 40, 8).set([0, 1, 7, 8, 9, 10, 11, 12]);
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});

  expect(converted.json.accessors).toMatchObject([
    {bufferView: 1},
    {bufferView: 2},
    {bufferView: 3},
    {bufferView: 3}
  ]);
  expect(converted.json.bufferViews?.[1].byteStride).toBe(16);
  expect(converted.json.bufferViews?.[2].target).toBe(34963);
  for (const viewIndex of [2, 3])
    expect(converted.json.bufferViews?.[viewIndex].byteStride).toBeUndefined();
  expect(converted.json.bufferViews?.[3].target).toBeUndefined();
  expect(
    [0, 1, 2, 3].map(index =>
      Array.from(getTypedArrayForAccessor(converted.json, converted.buffers, index))
    )
  ).toEqual([
    [1, 2, 3, 4, 5, 6],
    [0, 1, 0],
    [0, 1],
    [7, 8, 9, 10, 11, 12]
  ]);
});

test.each([
  0,
  undefined
])('glTF 1 packed vertex stride %s is removed from accessors', byteStride => {
  const converted = convertGLTFV1ToGLTF2(
    createLegacyAsset(
      {
        accessors: {
          positions: {bufferView: 'view', byteStride, componentType: 5126, count: 2, type: 'VEC3'}
        },
        meshes: {mesh: {primitives: [{attributes: {POSITION: 'positions'}}]}}
      },
      24
    ),
    {normalize: 'strict'}
  );
  expect(converted.json.accessors?.[0]).not.toHaveProperty('byteStride');
  expect(converted.json.bufferViews?.[1].byteStride).toBe(12);
});

test.each([
  3, 256, -4, 12.5, 8
])('glTF 1 unsupported vertex stride %s is reported and rejected in strict mode', byteStride => {
  const source = createLegacyAsset({
    accessors: {
      positions: {bufferView: 'view', byteStride, componentType: 5126, count: 2, type: 'VEC3'}
    },
    meshes: {mesh: {primitives: [{attributes: {POSITION: 'positions'}}]}}
  });
  expect(convertGLTFV1ToGLTF2(source).normalizationReport.unsupported).toEqual([
    expect.stringContaining('accessor 0 layout requires binary repacking')
  ]);
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(
    /requires binary repacking/
  );
});

test.each([
  {count: 2, byteStride: 16, byteLength: 24}
])('glTF 1 rejects a stride outside its buffer-view span ($count, $byteStride)', ({
  count,
  byteStride,
  byteLength
}) => {
  const source = createLegacyAsset(
    {
      accessors: {
        positions: {bufferView: 'view', byteStride, componentType: 5126, count, type: 'VEC3'}
      },
      meshes: {mesh: {primitives: [{attributes: {POSITION: 'positions'}}]}}
    },
    byteLength
  );
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(
    /requires binary repacking/
  );
});

test('glTF 1 non-vertex strides are repacked without changing values or caller bytes', () => {
  const source = createLegacyAsset({
    accessors: {
      values: {bufferView: 'view', byteStride: 8, componentType: 5126, count: 2, type: 'SCALAR'}
    }
  });
  new Float32Array(source.buffers[0].arrayBuffer, 0, 4).set([1, 99, 2, 99]);
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  expect(converted.json.accessors?.[0]).not.toHaveProperty('byteStride');
  expect(converted.json.bufferViews?.[1].byteStride).toBeUndefined();
  expect(Array.from(getTypedArrayForAccessor(converted.json, converted.buffers, 0))).toEqual([
    1, 2
  ]);
  expect(converted.buffers[0].arrayBuffer).not.toBe(source.buffers[0].arrayBuffer);
  expect(converted.normalizationReport.unsupported).toEqual([]);
});

test.each([
  {componentType: 5123, type: 'MAT2', byteLength: 8},
  {componentType: 5126, type: 'MAT3', byteLength: 36}
])('glTF 1 compatible packed matrix columns retain their layout: $type/$componentType', ({
  componentType,
  type,
  byteLength
}) => {
  const converted = convertGLTFV1ToGLTF2(
    createLegacyAsset(
      {
        accessors: {matrix: {bufferView: 'view', componentType, count: 1, type}}
      },
      byteLength
    ),
    {normalize: 'strict'}
  );
  expect(converted.json.accessors?.[0].bufferView).toBe(1);
  expect(converted.json.bufferViews?.[1].byteStride).toBeUndefined();
  expect(converted.normalizationReport.unsupported).toEqual([]);
});

test('glTF 1 matrix data is repacked to four-byte column alignment', () => {
  const source = createLegacyAsset({
    accessors: {
      matrix: {bufferView: 'view', byteOffset: 2, componentType: 5123, count: 1, type: 'MAT2'}
    }
  });
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  const view = converted.json.bufferViews![converted.json.accessors![0].bufferView!];
  expect(view.byteOffset! % 4).toBe(0);
  expect(Array.from(getTypedArrayForAccessor(converted.json, converted.buffers, 0))).toEqual([
    0, 0, 0, 0
  ]);
});

test('glTF 1 mixed accessor roles are separated without applying a vertex stride to animation', () => {
  const source = createLegacyAsset(
    {
      accessors: {
        positions: {
          bufferView: 'view',
          byteStride: 12,
          componentType: 5126,
          count: 2,
          type: 'VEC3'
        },
        time: {
          bufferView: 'view',
          byteOffset: 24,
          byteStride: 4,
          componentType: 5126,
          count: 2,
          type: 'SCALAR'
        }
      },
      meshes: {mesh: {primitives: [{attributes: {POSITION: 'positions'}}]}},
      nodes: {node: {meshes: ['mesh']}},
      animations: {
        animation: {
          parameters: {time: 'time', value: 'positions'},
          samplers: {sampler: {input: 'time', output: 'value'}},
          channels: [{sampler: 'sampler', target: {id: 'node', path: 'translation'}}]
        }
      }
    },
    32
  );
  new Float32Array(source.buffers[0].arrayBuffer).set([1, 2, 3, 4, 5, 6, 0, 1]);
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  const vertex = converted.json.meshes![0].primitives[0].attributes.POSITION;
  const output = converted.json.animations![0].samplers[0].output;
  expect(vertex).not.toBe(output);
  expect(
    converted.json.bufferViews![converted.json.accessors![output].bufferView!].byteStride
  ).toBeUndefined();
  expect(Array.from(getTypedArrayForAccessor(converted.json, converted.buffers, output))).toEqual([
    1, 2, 3, 4, 5, 6
  ]);
});

test('glTF 1 positive strides without a buffer view are reported', () => {
  const source = createLegacyAsset({
    accessors: {values: {byteStride: 4, componentType: 5126, count: 1, type: 'SCALAR'}}
  });
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(
    /requires binary repacking/
  );
});

test.each([
  {byteOffset: -4},
  {count: 0},
  {count: 1.5},
  {componentType: 9999},
  {type: 'INVALID'}
])('glTF 1 invalid accessor layout is reported: %j', overrides => {
  const source = createLegacyAsset({
    accessors: {
      positions: {bufferView: 'view', componentType: 5126, count: 2, type: 'VEC3', ...overrides}
    },
    meshes: {mesh: {primitives: [{attributes: {POSITION: 'positions'}}]}}
  });
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(
    /requires binary repacking/
  );
});

test.each([
  {accessorOffset: 0, viewOffset: -2}
])('glTF 1 packed indices require component alignment: %j', ({accessorOffset, viewOffset}) => {
  const source = createLegacyAsset({
    bufferViews: {view: {buffer: 'data', byteOffset: viewOffset, byteLength: 16}},
    accessors: {
      indices: {
        bufferView: 'view',
        byteOffset: accessorOffset,
        componentType: 5123,
        count: 3,
        type: 'SCALAR'
      }
    },
    meshes: {mesh: {primitives: [{attributes: {}, indices: 'indices'}]}}
  });
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(
    /requires binary repacking/
  );
});

test('glTF 1 accessor conversion retains original views used by embedded images', () => {
  const source = createLegacyAsset({
    bufferViews: {view: {buffer: 'data', byteLength: 128, extensions: {VENDOR_data: {value: 1}}}},
    accessors: {values: {bufferView: 'view', componentType: 5126, count: 2, type: 'SCALAR'}},
    images: {image: {extensions: {KHR_binary_glTF: {bufferView: 'view', mimeType: 'image/png'}}}}
  });
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  expect(converted.json.images?.[0].bufferView).toBe(0);
  expect(converted.json.accessors?.[0].bufferView).toBe(1);
  expect(converted.json.bufferViews?.[0]).toMatchObject({
    id: 'view',
    extensions: {VENDOR_data: {value: 1}}
  });
  expect(converted.json.bufferViews?.[1].id).toBeUndefined();
  expect(converted.json.bufferViews?.[1].extensions).toEqual({VENDOR_data: {value: 1}});
});

/** Supply one already-loaded binary payload for a small immutable legacy layout fixture. */
function createLegacyAsset(
  properties: Record<string, unknown>,
  byteLength: number = 128
): GLTFWithBuffers {
  return {
    json: {
      asset: {version: '1.0'},
      buffers: {data: {uri: 'data.bin', byteLength}},
      bufferViews: {view: {buffer: 'data', byteLength}},
      ...properties
    },
    buffers: [{arrayBuffer: new ArrayBuffer(byteLength), byteOffset: 0, byteLength}]
  } as unknown as GLTFWithBuffers;
}
