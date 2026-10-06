// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLTFWithBuffers} from '../../src/lib/types/gltf-types';

/** Tiny legacy skin/animation asset with raw two-component influences and a detached skeleton. */
export function createGLTFV1ConformanceAsset(): GLTFWithBuffers {
  const arrayBuffer = new ArrayBuffer(138);
  new Uint8Array(arrayBuffer).fill(0xa5);
  const data = new DataView(arrayBuffer);
  const values = [1, 2, 3, -1, 5, 2, 0, 1, 1, 0, 0.25, 0.75, 1, 0, 0, 1, 0, 0, 0, 1, 2, 3];
  values.forEach((value, index) => data.setFloat32(7 + index * 4, value, true));
  return {
    json: {
      asset: {version: '1.0'},
      buffers: {data: {byteLength: 128, uri: 'data.bin'}},
      bufferViews: {view: {buffer: 'data', byteLength: 128}},
      accessors: {
        positions: {
          bufferView: 'view',
          componentType: 5126,
          type: 'VEC3',
          count: 2,
          byteStride: 12
        },
        joints: {
          bufferView: 'view',
          byteOffset: 24,
          componentType: 5126,
          type: 'VEC2',
          count: 2,
          byteStride: 8
        },
        weights: {
          bufferView: 'view',
          byteOffset: 40,
          componentType: 5126,
          type: 'VEC2',
          count: 2,
          byteStride: 8
        },
        time: {bufferView: 'view', byteOffset: 56, componentType: 5126, type: 'SCALAR', count: 2},
        translation: {
          bufferView: 'view',
          byteOffset: 64,
          componentType: 5126,
          type: 'VEC3',
          count: 2
        }
      },
      meshes: {
        mesh: {
          primitives: [
            {mode: 0, attributes: {POSITION: 'positions', JOINT: 'joints', WEIGHT: 'weights'}}
          ]
        }
      },
      skins: {skin: {jointNames: ['root', 'child']}},
      nodes: {
        root: {jointName: 'root', children: ['child'], translation: [7, 0, 0]},
        child: {jointName: 'child'},
        instance: {meshes: ['mesh'], skin: 'skin', skeletons: ['root']}
      },
      scenes: {scene: {nodes: ['instance']}},
      scene: 'scene',
      animations: {
        animation: {
          parameters: {TIME: 'time', VALUE: 'translation'},
          samplers: {sampler: {input: 'TIME', output: 'VALUE'}},
          channels: [{sampler: 'sampler', target: {id: 'root', path: 'translation'}}]
        }
      }
    },
    buffers: [{arrayBuffer, byteOffset: 7, byteLength: 128}]
  } as unknown as GLTFWithBuffers;
}
