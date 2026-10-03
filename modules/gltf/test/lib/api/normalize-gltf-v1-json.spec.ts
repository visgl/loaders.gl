// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {convertGLTFV1ToGLTF2} from '@loaders.gl/gltf';
import type {GLTFWithBuffers} from '../../../src/lib/types/gltf-types';

describe('glTF 1 JSON conversion', () => {
  test('converts both camera types and references without changing projection values', () => {
    const source = makeLegacyAsset({
      cameras: {
        perspective: {type: 'perspective', perspective: {yfov: 1, znear: 0.1}},
        orthographic: {type: 'orthographic', orthographic: {xmag: 2, ymag: 3, znear: 0, zfar: 10}}
      },
      nodes: {first: {camera: 'perspective'}, second: {camera: 'orthographic'}}
    });
    const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});

    expect(converted.json.cameras).toMatchObject([
      {type: 'perspective', perspective: {yfov: 1, znear: 0.1}},
      {type: 'orthographic', orthographic: {xmag: 2, ymag: 3, znear: 0, zfar: 10}}
    ]);
    expect(converted.json.nodes).toMatchObject([{camera: 0}, {camera: 1}]);
    expect(converted.normalizationReport.unsupported).toEqual([]);
  });

  test('converts the inverse-bind accessor reference without claiming full skin conversion', () => {
    const converted = convertGLTFV1ToGLTF2(
      makeLegacyAsset({
        accessors: {matrices: {componentType: 5126, count: 1, type: 'MAT4'}},
        skins: {skin: {inverseBindMatrices: 'matrices', jointNames: ['joint']}}
      })
    );

    expect(converted.json.skins?.[0].inverseBindMatrices).toBe(0);
    expect(converted.json.skins?.[0].jointNames).toEqual(['joint']);
  });

  test.each([
    'camera',
    'inverseBindMatrices'
  ])('rejects an unresolved %s reference', referenceName => {
    const source = makeLegacyAsset(
      referenceName === 'camera'
        ? {nodes: {node: {camera: 'missing'}}}
        : {skins: {skin: {inverseBindMatrices: 'missing'}}}
    );

    expect(() => convertGLTFV1ToGLTF2(source)).toThrow(/failed to resolve/);
  });

  test('renames conventional attributes while retaining indexed and custom attributes', () => {
    const converted = convertGLTFV1ToGLTF2(
      makeLegacyAsset({
        accessors: {attribute: {componentType: 5126, count: 1, type: 'VEC4'}},
        meshes: {
          mesh: {
            primitives: [
              {
                attributes: {
                  JOINT: 'attribute',
                  WEIGHT: 'attribute',
                  TEXCOORD: 'attribute',
                  COLOR: 'attribute',
                  COLOR_0: 'attribute',
                  TEXCOORD_1: 'attribute',
                  _BATCHID: 'attribute',
                  POSITION: 'attribute'
                }
              }
            ]
          }
        }
      })
    );

    expect(converted.json.meshes?.[0].primitives[0].attributes).toEqual({
      JOINTS_0: 0,
      WEIGHTS_0: 0,
      TEXCOORD_0: 0,
      COLOR_0: 0,
      TEXCOORD_1: 0,
      _BATCHID: 0,
      POSITION: 0
    });
  });

  test('rejects conflicting aliases rather than losing an attribute', () => {
    const source = makeLegacyAsset({
      meshes: {
        mesh: {
          primitives: [
            {
              attributes: {
                COLOR: 'first',
                COLOR_0: 'second'
              }
            }
          ]
        }
      }
    });

    expect(() => convertGLTFV1ToGLTF2(source)).toThrow(
      /conflicting attribute aliases COLOR and COLOR_0/
    );
  });

  test.each([
    'geometry.bin',
    'data:application/octet-stream;base64,AAAA'
  ])('preserves buffer URI %s', uri => {
    const converted = convertGLTFV1ToGLTF2(
      makeLegacyAsset({
        buffers: {external: {uri, byteLength: 3, type: 'arraybuffer'}}
      })
    );

    expect(converted.json.buffers?.[0].uri).toBe(uri);
    expect(converted.json.buffers?.[0].type).toBeUndefined();
  });

  test('orders the named binary body first and converts embedded image JSON', () => {
    const source = makeLegacyAsset({
      buffers: {
        '0': {uri: 'geometry.bin', byteLength: 4},
        binary_glTF: {uri: 'data:,', byteLength: 4}
      },
      bufferViews: {
        image: {buffer: 'binary_glTF', byteLength: 4},
        geometry: {buffer: '0', byteLength: 4}
      },
      images: {
        image: {
          uri: 'ignored.png',
          extensions: {
            KHR_binary_glTF: {bufferView: 'image', mimeType: 'image/png', width: 1, height: 1},
            VENDOR_image: {keep: true}
          }
        }
      },
      extensionsUsed: ['KHR_binary_glTF', 'VENDOR_image'],
      extensionsRequired: ['KHR_binary_glTF']
    });
    const externalPayload = new Uint8Array([1, 2, 3, 4]).buffer;
    const binaryPayload = new Uint8Array([5, 6, 7, 8]).buffer;
    source.buffers = [externalPayload, binaryPayload].map(arrayBuffer => ({
      arrayBuffer,
      byteOffset: 0,
      byteLength: 4
    }));
    const originalJson = JSON.stringify(source.json);
    const converted = convertGLTFV1ToGLTF2(source);

    expect(converted.json.buffers).toMatchObject([{id: 'binary_glTF'}, {uri: 'geometry.bin'}]);
    expect(converted.json.buffers?.[0].uri).toBeUndefined();
    expect(converted.json.bufferViews).toMatchObject([{buffer: 0}, {buffer: 1}]);
    expect(converted.buffers.map(buffer => buffer.arrayBuffer)).toEqual([
      binaryPayload,
      externalPayload
    ]);
    expect(source.buffers.map(buffer => buffer.arrayBuffer)).toEqual([
      externalPayload,
      binaryPayload
    ]);
    expect(JSON.stringify(source.json)).toBe(originalJson);
    expect(converted.json.images?.[0]).toMatchObject({
      bufferView: 0,
      mimeType: 'image/png',
      extensions: {VENDOR_image: {keep: true}}
    });
    expect(converted.json.images?.[0].uri).toBeUndefined();
    expect(converted.json.images?.[0].width).toBeUndefined();
    expect(converted.json.images?.[0].extensions?.KHR_binary_glTF).toBeUndefined();
    expect(converted.json.extensionsUsed).toEqual(['VENDOR_image']);
    expect(converted.json.extensionsRequired).toBeUndefined();
  });

  test('removes consumed animation parameters and optional empty collections', () => {
    const converted = convertGLTFV1ToGLTF2(
      makeLegacyAsset({
        accessors: {
          input: {componentType: 5126, count: 1, type: 'SCALAR'},
          output: {componentType: 5126, count: 1, type: 'VEC3'}
        },
        nodes: {node: {}},
        animations: {
          animation: {
            parameters: {time: 'input', value: 'output'},
            samplers: {sampler: {input: 'time', output: 'value'}},
            channels: [{sampler: 'sampler', target: {id: 'node', path: 'translation'}}]
          }
        },
        cameras: {},
        textures: {},
        extensionsUsed: [],
        extras: {userArray: []}
      })
    );

    expect(converted.json.animations?.[0].samplers).toEqual([
      {input: 0, output: 1, interpolation: 'LINEAR'}
    ]);
    expect(converted.json.animations?.[0].parameters).toBeUndefined();
    for (const collectionName of ['cameras', 'textures', 'buffers', 'images', 'extensionsUsed']) {
      expect(converted.json[collectionName]).toBeUndefined();
    }
    expect(converted.json.extras?.userArray).toEqual([]);
  });
});

/** Wrap a small legacy JSON fixture without loading any external resources. */
function makeLegacyAsset(properties: Record<string, unknown>): GLTFWithBuffers {
  return {
    json: {asset: {version: '1.0'}, ...properties},
    buffers: []
  } as unknown as GLTFWithBuffers;
}
