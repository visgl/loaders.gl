// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {convertGLTFV1ToGLTF2} from '@loaders.gl/gltf';
import type {GLTFWithBuffers} from '../../../src/lib/types/gltf-types';
import {getTypedArrayForAccessor} from '../../../src/lib/gltf-utils/get-typed-array';

/** Exact identity used to verify the bind-shape case that requires no binary baking. */
const IDENTITY_MATRIX = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

test('glTF 1 skins preserve joint order and inverse-bind data, and consume identity bind shapes', () => {
  const source = createLegacyAsset({
    buffers: {data: {uri: 'data.bin', byteLength: 160}},
    bufferViews: {view: {buffer: 'data', byteLength: 160, target: 34962}},
    accessors: {
      matrices: {bufferView: 'view', byteStride: 64, componentType: 5126, count: 2, type: 'MAT4'},
      joints: {
        bufferView: 'view',
        byteOffset: 128,
        byteStride: 4,
        componentType: 5121,
        count: 1,
        type: 'VEC4'
      },
      weights: {
        bufferView: 'view',
        byteOffset: 132,
        byteStride: 16,
        componentType: 5126,
        count: 1,
        type: 'VEC4'
      },
      positions: {
        bufferView: 'view',
        byteOffset: 148,
        byteStride: 12,
        componentType: 5126,
        count: 1,
        type: 'VEC3'
      }
    },
    meshes: {
      mesh: {
        primitives: [
          {attributes: {JOINT: 'joints', WEIGHT: 'weights', POSITION: 'positions'}, mode: 0}
        ]
      }
    },
    skins: {
      skin: {
        jointNames: ['child', 'root'],
        inverseBindMatrices: 'matrices',
        bindShapeMatrix: IDENTITY_MATRIX
      }
    },
    nodes: {
      instance: {meshes: ['mesh', 'mesh'], skeletons: ['root'], skin: 'skin'},
      root: {jointName: 'root', children: ['child']},
      child: {jointName: 'child'}
    }
  });
  const payload = new ArrayBuffer(160);
  new Float32Array(payload, 0, 32).set([...IDENTITY_MATRIX, ...IDENTITY_MATRIX]);
  new Uint8Array(payload, 128, 4).set([0, 1, 0, 0]);
  new Float32Array(payload, 132, 4).set([0.5, 0.5, 0, 0]);
  new Float32Array(payload, 148, 3).set([1, 2, 3]);
  source.buffers = [{arrayBuffer: payload, byteOffset: 0, byteLength: 160}];
  const originalJson = JSON.stringify(source.json);
  const originalBytes = Array.from(new Uint8Array(payload));
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});

  expect(converted.json.skins?.[0]).toMatchObject({
    joints: [2, 1],
    skeleton: 1,
    inverseBindMatrices: 0
  });
  expect(converted.json.skins?.[0]).not.toHaveProperty('jointNames');
  expect(converted.json.skins?.[0]).not.toHaveProperty('bindShapeMatrix');
  expect(converted.json.nodes?.[0]).toMatchObject({mesh: 0, skin: 0, children: [3]});
  expect(converted.json.nodes?.[3]).toMatchObject({mesh: 0, skin: 0});
  expect(
    converted.json.nodes?.every(node => !('jointName' in node) && !('skeletons' in node))
  ).toBe(true);
  const matrixView = converted.json.bufferViews?.[converted.json.accessors![0].bufferView!];
  expect(matrixView?.byteStride).toBeUndefined();
  expect(matrixView?.target).toBeUndefined();
  expect(
    [0, 1, 2, 3].map(index =>
      Array.from(getTypedArrayForAccessor(converted.json, converted.buffers, index))
    )
  ).toEqual([
    [...IDENTITY_MATRIX, ...IDENTITY_MATRIX],
    [0, 1, 0, 0],
    [0.5, 0.5, 0, 0],
    [1, 2, 3]
  ]);
  expect(converted.normalizationReport.unsupported).toEqual([]);
  expect(JSON.stringify(source.json)).toBe(originalJson);
  expect(Array.from(new Uint8Array(payload))).toEqual(originalBytes);
});

test('glTF 1 shared skins are cloned for separate skeleton instances and reused for matching bindings', () => {
  const converted = convertGLTFV1ToGLTF2(
    createLegacyAsset({
      skins: {skin: {jointNames: ['child', 'root']}},
      nodes: {
        first: {skin: 'skin', skeletons: ['firstRoot']},
        second: {skin: 'skin', skeletons: ['secondRoot']},
        sameAsFirst: {skin: 'skin', skeletons: ['firstRoot']},
        firstRoot: {jointName: 'root', children: ['firstChild']},
        firstChild: {jointName: 'child'},
        secondRoot: {jointName: 'root', children: ['secondChild']},
        secondChild: {jointName: 'child'}
      }
    }),
    {normalize: 'strict'}
  );

  expect(converted.json.skins).toHaveLength(2);
  expect(converted.json.skins).toMatchObject([
    {joints: [4, 3], skeleton: 3},
    {joints: [6, 5], skeleton: 5}
  ]);
  expect(converted.json.skins?.[1].id).toBeUndefined();
  expect(converted.json.nodes?.slice(0, 3)).toMatchObject([{skin: 0}, {skin: 1}, {skin: 0}]);
});

test.each([
  true,
  false
])('glTF 1 infers a common root for unique names (instanced: %s)', instanced => {
  const converted = convertGLTFV1ToGLTF2(
    createLegacyAsset({
      skins: {skin: {jointNames: ['child', 'root']}},
      nodes: {
        root: {jointName: 'root', children: ['child']},
        child: {jointName: 'child'},
        ...(instanced ? {instance: {skin: 'skin'}} : {})
      }
    }),
    {normalize: 'strict'}
  );
  expect(converted.json.skins?.[0]).toMatchObject({joints: [1, 0], skeleton: 0});
});

test.each([
  'missing',
  'ambiguous'
])('glTF 1 %s joint bindings are reported and strict mode rejects them', condition => {
  const source = createLegacyAsset({
    skins: {skin: {jointNames: ['root']}},
    nodes:
      condition === 'missing'
        ? {first: {jointName: 'other'}}
        : {first: {jointName: 'root'}, second: {jointName: 'root'}}
  });
  const converted = convertGLTFV1ToGLTF2(source);
  expect(converted.normalizationReport.unsupported).toContain(
    'skin 0 cannot uniquely resolve joint root'
  );
  expect(converted.json.skins?.[0]).toHaveProperty('jointNames');
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(
    /cannot uniquely resolve joint root/
  );
});

test('glTF 1 multiple-root instances remain reported rather than selecting an arbitrary pivot', () => {
  const source = createLegacyAsset({
    skins: {skin: {jointNames: ['root']}},
    nodes: {
      instance: {skin: 'skin', skeletons: ['first', 'second']},
      first: {jointName: 'root'},
      second: {}
    }
  });
  expect(convertGLTFV1ToGLTF2(source).normalizationReport.unsupported).toContain(
    'skin 0 requires one skeleton root per instance'
  );
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(
    /requires one skeleton root/
  );
});

test('glTF 1 converts valid skin bindings while retaining a failed binding separately', () => {
  const converted = convertGLTFV1ToGLTF2(
    createLegacyAsset({
      skins: {skin: {jointNames: ['joint']}},
      nodes: {
        good: {skin: 'skin', skeletons: ['goodRoot']},
        bad: {skin: 'skin', skeletons: ['badRoot']},
        goodRoot: {jointName: 'joint'},
        badRoot: {}
      }
    })
  );
  expect(converted.normalizationReport.unsupported).toContain(
    'skin 0 cannot uniquely resolve joint joint'
  );
  expect(converted.json.skins?.[0]).toHaveProperty('jointNames');
  expect(converted.json.skins?.[1]).toMatchObject({joints: [2], skeleton: 2});
  expect(converted.json.nodes?.[0]).toMatchObject({skin: 1});
  expect(converted.json.nodes?.[0]).not.toHaveProperty('skeletons');
  expect(converted.json.nodes?.[1]).toMatchObject({skin: 0, skeletons: ['badRoot']});
});

test('glTF 1 non-identity bind shapes are diagnosed instead of silently dropping their transforms', () => {
  const source = createLegacyAsset({
    skins: {
      skin: {
        jointNames: ['root'],
        bindShapeMatrix: IDENTITY_MATRIX.map((value, index) => (index === 0 ? 2 : value))
      }
    },
    nodes: {root: {jointName: 'root'}}
  });
  const converted = convertGLTFV1ToGLTF2(source);
  expect(converted.json.skins?.[0]).toHaveProperty('bindShapeMatrix');
  expect(converted.normalizationReport.unsupported).toContain(
    'skin 0 non-identity bindShapeMatrix'
  );
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(
    /non-identity bindShapeMatrix/
  );
});

test.each([
  {jointNames: []},
  {jointNames: ['root', 'root']},
  {jointNames: ['']}
])('glTF 1 rejects invalid ordered joint names $jointNames', ({jointNames}) => {
  const source = createLegacyAsset({
    skins: {skin: {jointNames}},
    nodes: {root: {jointName: 'root'}}
  });
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(/invalid joint names/);
});

test.each([
  'cycle',
  'multipleParents',
  'disconnected'
])('glTF 1 diagnoses a %s joint hierarchy', condition => {
  const nodes =
    condition === 'cycle'
      ? {
          root: {jointName: 'root', children: ['child']},
          child: {jointName: 'child', children: ['root']}
        }
      : condition === 'multipleParents'
        ? {
            root: {jointName: 'root', children: ['child']},
            child: {jointName: 'child'},
            other: {children: ['child']}
          }
        : {root: {jointName: 'root'}, child: {jointName: 'child'}};
  const source = createLegacyAsset({skins: {skin: {jointNames: ['root', 'child']}}, nodes});
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow(
    /common hierarchy root/
  );
});

test('glTF 1 unresolved skeleton root IDs are rejected', () => {
  const source = createLegacyAsset({
    skins: {skin: {jointNames: ['root']}},
    nodes: {instance: {skin: 'skin', skeletons: ['missing']}, root: {jointName: 'root'}}
  });
  expect(() => convertGLTFV1ToGLTF2(source)).toThrow(/failed to resolve node with id missing/);
});

/** Wrap a small skin fixture; no resource fetches or image decoding are performed. */
function createLegacyAsset(properties: Record<string, unknown>): GLTFWithBuffers {
  return {
    json: {asset: {version: '1.0'}, ...properties},
    buffers: []
  } as unknown as GLTFWithBuffers;
}
