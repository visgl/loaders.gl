// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {convertGLTFV1ToGLTF2, normalizeGLTFV1} from '@loaders.gl/gltf';
import type {GLTFWithBuffers} from '../../../src/lib/types/gltf-types';
import {normalizeGLTFV1WithDeferredBuffers} from '../../../src/lib/api/normalize-gltf-v1';
import {getTypedArrayForAccessor} from '../../../src/lib/gltf-utils/get-typed-array';

import {
  createSkinAsset,
  BIND_SHAPE,
  ORIGINAL_MATRICES,
  BAKED_MATRICES
} from '../../test-utils/create-gltf-v1-skin';

test('glTF 1 bind shapes bake in palette order without overwriting shared data or caller bytes', () => {
  const source = createSkinAsset();
  const originalJson = JSON.stringify(source.json);
  const originalBytes = new Uint8Array(source.buffers[0].arrayBuffer).slice();
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  expect(converted.json.skins?.[0]).toMatchObject({
    joints: [1, 0],
    skeleton: 0,
    inverseBindMatrices: 4
  });
  expect(converted.json.skins?.[0]).not.toHaveProperty('bindShapeMatrix');
  expect(converted.json.buffers).toHaveLength(1);
  expect(converted.json.buffers?.[0].byteLength).toBe(312);
  expect(converted.json.bufferViews?.[8]).toEqual({buffer: 0, byteOffset: 184, byteLength: 128});
  expect(readAccessor(converted, 4)).toEqual(BAKED_MATRICES);
  expect(readAccessor(converted, 0)).toEqual(ORIGINAL_MATRICES);
  expect(readAccessor(converted, 1)).toEqual([1, 2, 3]);
  // The first baked matrix sends [1,2,3,1] to [-2,7,19,1], matching B then the original IBM.
  const matrix = readAccessor(converted, 4).slice(0, 16);
  expect([
    matrix[0] + 2 * matrix[4] + 3 * matrix[8] + matrix[12],
    matrix[1] + 2 * matrix[5] + 3 * matrix[9] + matrix[13],
    matrix[2] + 2 * matrix[6] + 3 * matrix[10] + matrix[14]
  ]).toEqual([-2, 7, 19]);
  expect(new Uint8Array(converted.buffers[0].arrayBuffer, 0, 181)).toEqual(
    originalBytes.subarray(5, 186)
  );
  expect(Array.from(new Uint8Array(converted.buffers[0].arrayBuffer, 181, 3))).toEqual([0, 0, 0]);
  expect(JSON.stringify(source.json)).toBe(originalJson);
  expect(new Uint8Array(source.buffers[0].arrayBuffer)).toEqual(originalBytes);
  expect(converted.buffers[0].arrayBuffer).not.toBe(source.buffers[0].arrayBuffer);
  expect(converted.normalizationReport.unsupported).toEqual([]);
});

test('glTF 1 distinct and identical bind shapes do not corrupt shared inverse-bind accessors', () => {
  const secondBindShape = BIND_SHAPE.map((value, index) => (index === 12 ? 8 : value));
  const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  const converted = convertGLTFV1ToGLTF2(
    createSkinAsset({
      jsonOverrides: {
        skins: {
          first: {
            jointNames: ['child', 'root'],
            inverseBindMatrices: 'matrices',
            bindShapeMatrix: BIND_SHAPE
          },
          second: {
            jointNames: ['child', 'root'],
            inverseBindMatrices: 'matrices',
            bindShapeMatrix: secondBindShape
          },
          unchanged: {
            jointNames: ['child', 'root'],
            inverseBindMatrices: 'matrices',
            bindShapeMatrix: identity
          },
          sameAsFirst: {
            jointNames: ['child', 'root'],
            inverseBindMatrices: 'matrices',
            bindShapeMatrix: BIND_SHAPE
          }
        },
        nodes: {root: {jointName: 'root', children: ['child']}, child: {jointName: 'child'}},
        scenes: {scene: {nodes: ['root']}}
      }
    }),
    {normalize: 'strict'}
  );
  expect(converted.json.skins?.map(skin => skin.inverseBindMatrices)).toEqual([4, 5, 0, 4]);
  expect(converted.json.buffers?.[0].byteLength).toBe(440);
  expect(readAccessor(converted, 0)).toEqual(ORIGINAL_MATRICES);
  expect(readAccessor(converted, 4)).toEqual(BAKED_MATRICES);
  const secondExpected = BAKED_MATRICES.map((value, index) =>
    index === 13 || index === 28 ? 8 : value
  );
  expect(readAccessor(converted, 5)).toEqual(secondExpected);
});

test('glTF 1 baking updates URI-backed bytes at a nonzero buffer index and preserves other payloads', () => {
  const source = createSkinAsset({bufferId: 'external', uri: 'matrices.bin'});
  const otherBytes = new Uint8Array([1, 2, 3, 4]).buffer;
  source.json.buffers = {
    external: {byteLength: 181, uri: 'matrices.bin'},
    binary_glTF: {byteLength: 4, uri: 'data:,'}
  } as unknown as typeof source.json.buffers;
  source.buffers.push({arrayBuffer: otherBytes, byteOffset: 0, byteLength: 4});
  const originalJson = JSON.stringify(source.json);
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  expect(converted.buffers[0].arrayBuffer).toBe(otherBytes);
  expect(converted.json.bufferViews?.[8].buffer).toBe(1);
  expect(converted.json.buffers?.[1].uri).toMatch(/^data:application\/octet-stream;base64,/);
  const decoded = Uint8Array.from(atob(converted.json.buffers![1].uri!.split(',')[1]), character =>
    character.charCodeAt(0)
  );
  expect(decoded).toEqual(new Uint8Array(converted.buffers[1].arrayBuffer));
  expect(readAccessor(converted, 4)).toEqual(BAKED_MATRICES);
  expect(JSON.stringify(source.json)).toBe(originalJson);
  expect(source.buffers[1].arrayBuffer).toBe(otherBytes);
});

test('glTF 1 deferred baking finishes once and supports already-normalized inputs', () => {
  const source = createSkinAsset();
  const finish = normalizeGLTFV1WithDeferredBuffers(source, {normalize: 'strict'});
  expect(source.json.skins?.[0]).toHaveProperty('bindShapeMatrix');
  expect(source.json.buffers?.[0].byteLength).toBe(181);
  expect(finish().unsupported).toEqual([]);
  const completedBuffer = source.buffers[0].arrayBuffer;
  expect(finish().unsupported).toEqual([]);
  expect(source.buffers[0].arrayBuffer).toBe(completedBuffer);
  expect(source.json.accessors).toHaveLength(5);
  const secondFinish = normalizeGLTFV1WithDeferredBuffers(source, {normalize: 'strict'});
  expect(secondFinish().converted).toBe(false);
  expect(source.buffers[0].arrayBuffer).toBe(completedBuffer);
});

test('glTF 1 non-mutating report conversion also leaves borrowed buffers untouched', () => {
  const source = createSkinAsset();
  const originalJson = JSON.stringify(source.json);
  const originalBuffer = source.buffers[0].arrayBuffer;
  const originalBytes = new Uint8Array(originalBuffer).slice();
  expect(normalizeGLTFV1(source, {normalize: 'strict', mutate: false}).mutated).toBe(false);
  expect(JSON.stringify(source.json)).toBe(originalJson);
  expect(source.buffers[0].arrayBuffer).toBe(originalBuffer);
  expect(new Uint8Array(originalBuffer)).toEqual(originalBytes);
});

test.each([
  {bindShapeMatrix: null},
  {bindShapeMatrix: [1, 2]},
  {bindShapeMatrix: BIND_SHAPE.map((value, index) => (index === 3 ? 1 : value))},
  {bindShapeMatrix: BIND_SHAPE.map((value, index) => (index === 0 ? Number.NaN : value))}
])('glTF 1 unsupported bind shape is preserved and reported: %j', options => {
  const source = createSkinAsset(options);
  const converted = convertGLTFV1ToGLTF2(source);
  expect(converted.json.skins?.[0]).toHaveProperty('bindShapeMatrix');
  expect(converted.normalizationReport.unsupported).toContain(
    'skin 0 non-identity bindShapeMatrix requires a finite affine matrix'
  );
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(/finite affine matrix/);
});

test.each([
  {
    matrixValues: ORIGINAL_MATRICES.map((value, index) => (index === 0 ? Number.NaN : value)),
    reason: 'requires finite affine inverse-bind matrices'
  },
  {
    matrixValues: ORIGINAL_MATRICES.map((value, index) => (index === 3 ? 1 : value)),
    reason: 'requires finite affine inverse-bind matrices'
  },
  {
    bindShapeMatrix: BIND_SHAPE.map((value, index) => (index === 0 ? 1e40 : value)),
    reason: 'produces non-finite FLOAT matrix values'
  }
])('glTF 1 matrix baking rejects invalid output: $reason', ({reason, ...options}) => {
  const source = createSkinAsset(options);
  const converted = convertGLTFV1ToGLTF2(source);
  expect(converted.normalizationReport.unsupported).toContain(
    `skin 0 non-identity bindShapeMatrix ${reason}`
  );
  expect(converted.buffers[0].arrayBuffer).toBe(source.buffers[0].arrayBuffer);
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(reason);
});

test.each([
  {componentType: 5123},
  {type: 'VEC4'},
  {count: 0},
  {count: 1.5},
  {normalized: true},
  {sparse: {}},
  {extensions: {VENDOR_data: {}}}
])('glTF 1 bind baking requires an appropriate matrix accessor: %j', overrides => {
  const source = createSkinAsset({matrixAccessorOverrides: overrides});
  expect(convertGLTFV1ToGLTF2(source).normalizationReport.unsupported).toContain(
    'skin 0 non-identity bindShapeMatrix requires packed FLOAT MAT4 inverse-bind matrices'
  );
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(
    /normalization does not support/
  );
});

test('glTF 1 bind baking requires enough matrices for the joint palette', () => {
  const source = createSkinAsset({matrixAccessorOverrides: {count: 1}});
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(
    /too few inverse-bind matrices/
  );
});

test('glTF 1 bind baking reports a missing loaded matrix buffer', () => {
  const source = createSkinAsset();
  source.buffers = [];
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(
    /loaded inverse-bind buffer/
  );
});

test.each([
  {byteOffset: -1},
  {byteOffset: 5.5},
  {byteLength: 160},
  {byteLength: 1000}
])('glTF 1 bind baking validates borrowed buffer spans: %j', loadedBufferOverrides => {
  const source = createSkinAsset({loadedBufferOverrides});
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(
    /invalid inverse-bind buffer layout/
  );
});

test('glTF 1 strict baking does not commit valid plans if another bind shape fails', () => {
  const source = createSkinAsset({
    jsonOverrides: {
      skins: {
        first: {
          jointNames: ['child', 'root'],
          inverseBindMatrices: 'matrices',
          bindShapeMatrix: BIND_SHAPE
        },
        invalid: {
          jointNames: ['child', 'root'],
          inverseBindMatrices: 'matrices',
          bindShapeMatrix: [1, 2]
        }
      },
      nodes: {root: {jointName: 'root', children: ['child']}, child: {jointName: 'child'}},
      scenes: {scene: {nodes: ['root']}}
    }
  });
  const originalBuffer = source.buffers[0].arrayBuffer;
  expect(() => normalizeGLTFV1(source, {normalize: 'strict'})).toThrow(/finite affine matrix/);
  expect(source.buffers[0].arrayBuffer).toBe(originalBuffer);
  expect(source.json.buffers?.[0].byteLength).toBe(181);
  expect(source.json.skins?.[0]).toHaveProperty('bindShapeMatrix');
  const converted = convertGLTFV1ToGLTF2(
    createSkinAsset({
      jsonOverrides: {
        skins: {
          first: {
            jointNames: ['child', 'root'],
            inverseBindMatrices: 'matrices',
            bindShapeMatrix: BIND_SHAPE
          },
          invalid: {
            jointNames: ['child', 'root'],
            inverseBindMatrices: 'matrices',
            bindShapeMatrix: [1, 2]
          }
        },
        nodes: {root: {jointName: 'root', children: ['child']}, child: {jointName: 'child'}},
        scenes: {scene: {nodes: ['root']}}
      }
    })
  );
  expect(converted.json.skins?.[0]).not.toHaveProperty('bindShapeMatrix');
  expect(converted.json.skins?.[1]).toMatchObject({
    inverseBindMatrices: 0,
    bindShapeMatrix: [1, 2]
  });
  expect(readAccessor(converted, 0)).toEqual(ORIGINAL_MATRICES);
  expect(readAccessor(converted, 4)).toEqual(BAKED_MATRICES);
});

test('glTF 1 cached bind baking still validates each skin palette length', () => {
  const source = createSkinAsset({
    matrixAccessorOverrides: {count: 1},
    jsonOverrides: {
      skins: {
        first: {
          jointNames: ['child'],
          inverseBindMatrices: 'matrices',
          bindShapeMatrix: BIND_SHAPE
        },
        second: {
          jointNames: ['child', 'root'],
          inverseBindMatrices: 'matrices',
          bindShapeMatrix: BIND_SHAPE
        }
      },
      nodes: {root: {jointName: 'root', children: ['child']}, child: {jointName: 'child'}},
      scenes: {scene: {nodes: ['root']}}
    }
  });
  const converted = convertGLTFV1ToGLTF2(source);
  expect(converted.normalizationReport.unsupported).toContain(
    'skin 1 non-identity bindShapeMatrix has too few inverse-bind matrices'
  );
  expect(converted.json.skins?.[0]).not.toHaveProperty('bindShapeMatrix');
  expect(converted.json.skins?.[1]).toHaveProperty('bindShapeMatrix');
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(
    /too few inverse-bind matrices/
  );
});

test('glTF 1 baking does not interpret extension-bearing matrix views as plain floats', () => {
  const source = createSkinAsset();
  const views = source.json.bufferViews as unknown as Record<
    string,
    {extensions?: Record<string, unknown>}
  >;
  views.matrices.extensions = {VENDOR_data: {}};
  expect(convertGLTFV1ToGLTF2(source).normalizationReport.unsupported).toContain(
    'skin 0 non-identity bindShapeMatrix does not support inverse-bind buffer-view extensions'
  );
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(
    /buffer-view extensions/
  );
});

test.each([
  {matrixAccessorOverrides: {byteOffset: 16}},
  {
    jsonOverrides: {
      bufferViews: {
        matrices: {buffer: 'binary_glTF', byteOffset: 4, byteLength: 180},
        geometry: {buffer: 'binary_glTF', byteOffset: 148, byteLength: 12},
        joints: {buffer: 'binary_glTF', byteOffset: 160, byteLength: 4},
        weights: {buffer: 'binary_glTF', byteOffset: 164, byteLength: 16}
      }
    }
  },
  {loadedBufferOverrides: {arrayBuffer: null}}
])('glTF 1 malformed matrix spans are reported without reading out of bounds: %j', options => {
  const source = createSkinAsset(options);
  expect(convertGLTFV1ToGLTF2(source).normalizationReport.unsupported).toContain(
    'skin 0 non-identity bindShapeMatrix has an invalid inverse-bind buffer layout'
  );
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(
    /normalization does not support/
  );
});

/** Decode values through the normal glTF 2 accessor path. */
function readAccessor(gltf: GLTFWithBuffers, accessorIndex: number): number[] {
  return Array.from(getTypedArrayForAccessor(gltf.json, gltf.buffers, accessorIndex)) as number[];
}
