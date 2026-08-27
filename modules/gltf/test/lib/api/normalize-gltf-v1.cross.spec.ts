// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {convertGLTFV1ToGLTF2, normalizeGLTFV1} from '@loaders.gl/gltf';
import type {GLTFWithBuffers} from '../../../src/lib/types/gltf-types';

describe('glTF 1 normalization', () => {
  test('converts object maps, multi-mesh nodes, and animation references', () => {
    const gltf = makeGLTFV1();
    const report = normalizeGLTFV1(gltf, {normalize: true});

    expect(report.converted).toBe(true);
    expect(gltf.json.asset?.version).toBe('2.0');
    expect(gltf.json.meshes).toHaveLength(2);
    expect(gltf.json.nodes?.[0].mesh).toBe(0);
    expect(gltf.json.nodes?.[0].children).toEqual([1]);
    expect(gltf.json.nodes?.[1].mesh).toBe(1);
    expect(gltf.json.animations?.[0].samplers?.[0]).toMatchObject({input: 0, output: 0});
    expect(gltf.json.animations?.[0].channels?.[0]).toMatchObject({
      sampler: 0,
      target: {node: 0, path: 'translation'}
    });
  });

  test('preserves legacy techniques in extras and reports them', () => {
    const gltf = makeGLTFV1();
    gltf.json.techniques = {technique0: {parameters: {}}};
    const report = normalizeGLTFV1(gltf, {normalize: true});

    expect(report.unsupported).toContain('legacy techniques');
    expect(gltf.json.extras?.gltf1Resources.techniques).toEqual({technique0: {parameters: {}}});
    expect(gltf.json.techniques).toBeUndefined();
  });

  test('strict mode rejects unsupported legacy resources', () => {
    const gltf = makeGLTFV1();
    gltf.json.programs = {program0: {vertexShader: 'shader0'}};

    expect(() => normalizeGLTFV1(gltf, {normalize: 'strict'})).toThrow(/legacy programs/);
  });

  test('offers a non-mutating conversion entry point', () => {
    const gltf = makeGLTFV1();
    const originalJson = JSON.stringify(gltf.json);

    const converted = convertGLTFV1ToGLTF2(gltf);

    expect(JSON.stringify(gltf.json)).toBe(originalJson);
    expect(converted.json).not.toBe(gltf.json);
    expect(converted.json.asset?.version).toBe('2.0');
    expect(converted.normalizationReport.mutated).toBe(false);
  });

  test('supports non-mutating normalization through the report API', () => {
    const gltf = makeGLTFV1();
    const originalJson = JSON.stringify(gltf.json);

    const report = normalizeGLTFV1(gltf, {normalize: true, mutate: false});

    expect(report.converted).toBe(true);
    expect(report.mutated).toBe(false);
    expect(JSON.stringify(gltf.json)).toBe(originalJson);
  });
});

/** Create a compact glTF 1 object-map asset with representative legacy relationships. */
function makeGLTFV1(): GLTFWithBuffers {
  const source = new Float32Array([0, 0, 0]);
  return {
    json: {
      asset: {version: '1.0'},
      scene: 'scene0',
      scenes: {scene0: {nodes: ['node0']}},
      nodes: {
        node0: {meshes: ['mesh0', 'mesh1']}
      },
      meshes: {
        mesh0: {primitives: [{attributes: {POSITION: 'accessor0'}}]},
        mesh1: {primitives: [{attributes: {POSITION: 'accessor0'}}]}
      },
      accessors: {
        accessor0: {bufferView: 'bufferView0', componentType: 5126, count: 1, type: 'VEC3'}
      },
      bufferViews: {
        bufferView0: {buffer: 'buffer0', byteLength: source.byteLength}
      },
      buffers: {
        buffer0: {byteLength: source.byteLength, type: 'arraybuffer'}
      },
      animations: {
        animation0: {
          samplers: {sampler0: {input: 'accessor0', output: 'accessor0'}},
          channels: [{sampler: 'sampler0', target: {id: 'node0', path: 'translation'}}]
        }
      }
    },
    buffers: [{arrayBuffer: source.buffer, byteOffset: 0, byteLength: source.byteLength}]
  } as GLTFWithBuffers;
}
