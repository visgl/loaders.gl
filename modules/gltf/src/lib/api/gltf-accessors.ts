// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {BigTypedArray} from '@loaders.gl/core/schema';
import type {GLTFWithBuffers, GLTFAccessor} from '../types/gltf-types';
import {getTypedArrayForAccessor} from '../gltf-utils/get-typed-array';
import {getComponentTypeFromArray} from '../gltf-utils/gltf-utils';
import {assert} from '../utils/assert';
import {padToNBytes} from '@loaders.gl/core/loader-utils';

/** Indexed or inline accessor, including optional values supplied by mesh decoders. */
export type GLTFAccessorReference = number | (GLTFAccessor & {value?: BigTypedArray});

/** Resolve an indexed or decoder-provided inline accessor without linking the scene graph. */
export function getGLTFAccessor(
  gltf: GLTFWithBuffers,
  reference: GLTFAccessorReference
): GLTFAccessor {
  const accessor = typeof reference === 'number' ? gltf.json.accessors?.[reference] : reference;
  assert(accessor);
  return accessor!;
}

/**
 * Read packed accessor values without replacing JSON indices. Packed dense values borrow storage;
 * interleaved, unaligned, padded matrix and sparse values are materialized. Normalized integers
 * retain their stored values. Accessors without a buffer view start at zero; decoder values are
 * preserved. Sparse substitutions never modify input storage.
 */
export function getGLTFAccessorValue(
  gltf: GLTFWithBuffers,
  reference: GLTFAccessorReference
): BigTypedArray {
  return getTypedArrayForAccessor(gltf.json, gltf.buffers, reference);
}

/**
 * Replace accessor storage with a packed value, preserving index references and other accessors.
 * Packed storage borrows the supplied array; padded matrix columns are copied. Sparse and decoder overrides are cleared so reads,
 * encoders and writers observe the replacement. Bounds metadata remains caller-owned.
 */
export function setGLTFAccessorValue(
  gltf: GLTFWithBuffers,
  reference: GLTFAccessorReference,
  value: BigTypedArray
): void {
  const accessor = getGLTFAccessor(gltf, reference);
  const componentType = getComponentTypeFromArray(value);
  const components = accessor.type.startsWith('MAT')
    ? Number(accessor.type.slice(3)) ** 2
    : accessor.type === 'SCALAR'
      ? 1
      : Number(accessor.type.slice(3));
  assert(value.length === accessor.count * components);
  const columns = accessor.type.startsWith('MAT') ? Number(accessor.type.slice(3)) : 1;
  const columnByteLength = columns * value.BYTES_PER_ELEMENT;
  const columnByteStride = padToNBytes(columnByteLength, 4);
  let storage = {
    arrayBuffer: value.buffer as ArrayBuffer,
    byteOffset: value.byteOffset,
    byteLength: value.byteLength
  };
  if (columns > 1 && columnByteStride !== columnByteLength) {
    const bytes = new Uint8Array(accessor.count * columns * columnByteStride);
    const source = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    for (let columnIndex = 0; columnIndex < accessor.count * columns; columnIndex++) {
      bytes.set(
        source.subarray(columnIndex * columnByteLength, (columnIndex + 1) * columnByteLength),
        columnIndex * columnByteStride
      );
    }
    storage = {arrayBuffer: bytes.buffer, byteOffset: 0, byteLength: bytes.byteLength};
  }
  const bufferIndex = Math.max(gltf.buffers.length, gltf.json.buffers?.length || 0);
  gltf.json.buffers ||= [];
  gltf.json.buffers[bufferIndex] = {byteLength: storage.byteLength};
  gltf.buffers[bufferIndex] = storage;
  gltf.json.bufferViews ||= [];
  const bufferViews = gltf.json.bufferViews;
  accessor.bufferView = bufferViews.length;
  bufferViews.push({buffer: bufferIndex, byteOffset: 0, byteLength: storage.byteLength});
  accessor.byteOffset = 0;
  accessor.componentType = componentType;
  delete accessor.sparse;
  delete (accessor as GLTFAccessor & {value?: BigTypedArray}).value;
}
