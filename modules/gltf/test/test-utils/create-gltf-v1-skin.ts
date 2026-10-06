// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLTFWithBuffers} from '../../src/lib/types/gltf-types';

/** Non-commuting scale/translation exposes the wrong multiplication order. */
export const BIND_SHAPE = [2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 4, 0, 5, 6, 7, 1];
/** First joint rotates 90 degrees about Z and translates X; second translates Y. */
export const ORIGINAL_MATRICES = [
  0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1, 0, 10, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 20, 0, 1
];
/** Products IBM * B, retaining palette order. */
export const BAKED_MATRICES = [
  0, 2, 0, 0, -3, 0, 0, 0, 0, 0, 4, 0, 4, 5, 7, 1, 2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 4, 0, 5, 26, 7, 1
];
/** Packed source matrices start after both a buffer-view and an accessor offset. */
export const MATRIX_ACCESSOR = {
  bufferView: 'matrices',
  byteOffset: 8,
  componentType: 5126,
  count: 2,
  type: 'MAT4'
};

/** Configuration for one small deterministic skin asset and its borrowed payload. */
type SkinAssetOptions = {
  /** Optional raw JSON replacements for boundary coverage. */
  jsonOverrides?: Record<string, unknown>;
  /** Matrix accessor replacements for boundary coverage. */
  matrixAccessorOverrides?: Record<string, unknown>;
  /** Bind shape, including malformed values to verify diagnostics. */
  bindShapeMatrix?: unknown;
  /** Ordered source matrix values. */
  matrixValues?: number[];
  /** Source buffer's legacy dictionary ID. */
  bufferId?: string;
  /** Source URI, replaced only if baking changes its bytes. */
  uri?: string;
  /** Borrowed descriptor overrides, without changing the actual backing bytes. */
  loadedBufferOverrides?: Record<string, unknown>;
};

/** Two joints and one point, with padding and an unaligned borrowed backing-buffer offset. */
export function createSkinAsset(options: SkinAssetOptions = {}): GLTFWithBuffers {
  const bufferId = options.bufferId || 'binary_glTF';
  const backingBuffer = new ArrayBuffer(197);
  new Uint8Array(backingBuffer).fill(0xa5);
  const backingData = new DataView(backingBuffer);
  for (const [componentIndex, value] of (options.matrixValues || ORIGINAL_MATRICES).entries()) {
    backingData.setFloat32(17 + componentIndex * 4, value, true);
  }
  for (const [componentIndex, value] of [1, 2, 3].entries())
    backingData.setFloat32(153 + componentIndex * 4, value, true);
  new Uint8Array(backingBuffer, 165, 4).set([0, 1, 0, 0]);
  [0.5, 0.5, 0, 0].forEach((value, index) => backingData.setFloat32(169 + index * 4, value, true));
  return {
    json: {
      asset: {version: '1.0'},
      buffers: {[bufferId]: {byteLength: 181, uri: options.uri ?? 'data:,'}},
      bufferViews: {
        matrices: {buffer: bufferId, byteOffset: 4, byteLength: 140},
        geometry: {buffer: bufferId, byteOffset: 148, byteLength: 12},
        joints: {buffer: bufferId, byteOffset: 160, byteLength: 4},
        weights: {buffer: bufferId, byteOffset: 164, byteLength: 16}
      },
      accessors: {
        matrices: {...MATRIX_ACCESSOR, ...options.matrixAccessorOverrides},
        positions: {
          bufferView: 'geometry',
          componentType: 5126,
          count: 1,
          type: 'VEC3',
          min: [1, 2, 3],
          max: [1, 2, 3]
        },
        joints: {bufferView: 'joints', componentType: 5121, count: 1, type: 'VEC4'},
        weights: {bufferView: 'weights', componentType: 5126, count: 1, type: 'VEC4'}
      },
      skins: {
        skin: {
          jointNames: ['child', 'root'],
          inverseBindMatrices: 'matrices',
          bindShapeMatrix: Object.hasOwn(options, 'bindShapeMatrix')
            ? options.bindShapeMatrix
            : BIND_SHAPE
        }
      },
      meshes: {
        point: {
          primitives: [
            {attributes: {POSITION: 'positions', JOINT: 'joints', WEIGHT: 'weights'}, mode: 0}
          ]
        }
      },
      nodes: {
        root: {jointName: 'root', children: ['child']},
        child: {jointName: 'child'},
        instance: {skin: 'skin', skeletons: ['root'], meshes: ['point']}
      },
      scenes: {scene: {nodes: ['root', 'instance']}},
      scene: 'scene',
      ...options.jsonOverrides
    },
    buffers: [
      {arrayBuffer: backingBuffer, byteOffset: 5, byteLength: 181, ...options.loadedBufferOverrides}
    ]
  } as unknown as GLTFWithBuffers;
}
