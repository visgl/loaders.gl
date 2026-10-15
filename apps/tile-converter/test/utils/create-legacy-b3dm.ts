// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {encodeSync, parse} from '@loaders.gl/core';
import {GLTFLoader, GLBWriter} from '@loaders.gl/gltf';
import {createGLBV1} from '../../../../modules/gltf/test/test-utils/create-glb-v1';

/** Tiny static legacy mesh with an ECEF RTC center, inverse up-axis rotation and two features. */
export async function createLegacyB3dm(modern = false) {
  const positions = new Float32Array([0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 0, 0, 10, 10, 2, 0, 10, 0]);
  const normals = new Float32Array(Array.from({length: 6}, () => [0, 0, 1]).flat());
  const batchIds = new Uint16Array([0, 0, 0, 1, 1, 1]);
  const indices = new Uint32Array([0, 1, 2, 3, 4, 5]);
  const body = new Uint8Array(
    positions.byteLength + normals.byteLength + batchIds.byteLength + indices.byteLength
  );
  let byteOffset = 0;
  for (const values of [positions, normals, batchIds, indices]) {
    body.set(new Uint8Array(values.buffer), byteOffset);
    byteOffset += values.byteLength;
  }
  const rtcCenter = [4157168.3530693445, 671218.0838469741, 4774702.619661819];
  const glb = createGLBV1(
    {
      asset: {version: '1.0'},
      extensionsUsed: ['KHR_binary_glTF', 'CESIUM_RTC'],
      extensions: {CESIUM_RTC: {center: rtcCenter}},
      buffers: {binary_glTF: {uri: 'data:,', byteLength: body.byteLength, type: 'arraybuffer'}},
      bufferViews: {view: {buffer: 'binary_glTF', byteLength: body.byteLength}},
      accessors: {
        position: {bufferView: 'view', byteOffset: 0, componentType: 5126, count: 6, type: 'VEC3'},
        normal: {bufferView: 'view', byteOffset: 72, componentType: 5126, count: 6, type: 'VEC3'},
        batchId: {
          bufferView: 'view',
          byteOffset: 144,
          componentType: 5123,
          count: 6,
          type: 'SCALAR'
        },
        index: {bufferView: 'view', byteOffset: 156, componentType: 5125, count: 6, type: 'SCALAR'}
      },
      meshes: {
        mesh: {
          primitives: [
            {
              attributes: {POSITION: 'position', NORMAL: 'normal', _BATCHID: 'batchId'},
              indices: 'index',
              material: 'material',
              mode: 4
            }
          ]
        }
      },
      materials: {material: {values: {diffuse: [1, 1, 1, 1]}}},
      nodes: {root: {meshes: ['mesh'], matrix: [1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1]}},
      scenes: {scene: {nodes: ['root']}},
      scene: 'scene'
    },
    body
  );
  const gltfEncoded = modern
    ? encodeSync(
        await parse(glb, GLTFLoader, {gltf: {loadImages: false}, core: {worker: false}}),
        GLBWriter
      )
    : glb;
  const featureJson = new TextEncoder().encode(JSON.stringify({BATCH_LENGTH: 2}));
  const batchJson = new TextEncoder().encode(JSON.stringify({label: ['first', 'second']}));
  const featureLength = Math.ceil((28 + featureJson.length) / 8) * 8 - 28;
  const batchLength = Math.ceil(batchJson.length / 8) * 8;
  const payloadOffset = 28 + featureLength + batchLength;
  const binary = new Uint8Array(payloadOffset + gltfEncoded.byteLength);
  const header = new DataView(binary.buffer);
  [0x6d643362, 1, binary.byteLength, featureLength, 0, batchLength, 0].forEach((value, index) =>
    header.setUint32(index * 4, value, true)
  );
  binary.fill(0x20, 28, payloadOffset);
  binary.set(featureJson, 28);
  binary.set(batchJson, 28 + featureLength);
  binary.set(new Uint8Array(gltfEncoded), payloadOffset);
  const b3dm = binary.buffer;
  return {b3dm, glb, positions, rtcCenter};
}
