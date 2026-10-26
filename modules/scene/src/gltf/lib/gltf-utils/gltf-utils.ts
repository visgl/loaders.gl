// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {assert} from '../utils/assert';

import type {GLTFWithBuffers, GLTFAccessor} from '../types/gltf-types';
import {BYTES, COMPONENTS} from './gltf-constants';

/**
 * Memory needed to store texture and all mipmap levels 1 + 1/4 + 1/16 + 1/64 + ...
 * Minimum 1.33, but due to GPU layout may be 1.5
 */
const MIPMAP_FACTOR = 1.33;

const TYPES = ['SCALAR', 'VEC2', 'VEC3', 'VEC4'];

type TypedArrayConstructor =
  | Int8ArrayConstructor
  | Uint8ArrayConstructor
  | Int16ArrayConstructor
  | Uint16ArrayConstructor
  | Int32ArrayConstructor
  | Uint32ArrayConstructor
  | Float32ArrayConstructor
  | Float64ArrayConstructor
  | BigInt64ArrayConstructor
  | BigUint64ArrayConstructor;

const ARRAY_CONSTRUCTOR_TO_WEBGL_CONSTANT: [TypedArrayConstructor, number][] = [
  [Int8Array, 5120],
  [Uint8Array, 5121],
  [Int16Array, 5122],
  [Uint16Array, 5123],
  [Int32Array, 5124],
  [Uint32Array, 5125],
  [Float32Array, 5126],
  [Float64Array, 5130],
  [BigInt64Array, 5134],
  [BigUint64Array, 5135]
];
const ARRAY_TO_COMPONENT_TYPE = new Map<TypedArrayConstructor, number>(
  ARRAY_CONSTRUCTOR_TO_WEBGL_CONSTANT
);

const ATTRIBUTE_TYPE_TO_COMPONENTS = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16
};

const ATTRIBUTE_COMPONENT_TYPE_TO_BYTE_SIZE = {
  5120: 1,
  5121: 1,
  5122: 2,
  5123: 2,
  5124: 4,
  5125: 4,
  5126: 4,
  5130: 8,
  5131: 2,
  5134: 8,
  5135: 8
};

const ATTRIBUTE_COMPONENT_TYPE_TO_ARRAY = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5124: Int32Array,
  5125: Uint32Array,
  5126: Float32Array,
  5130: Float64Array,
  // JavaScript does not yet provide Float16Array across supported runtimes.
  // Preserve binary16 payloads in Uint16Array while componentType retains their semantics.
  5131: Uint16Array,
  5134: BigInt64Array,
  5135: BigUint64Array
};

export function getAccessorTypeFromSize(size) {
  const type = TYPES[size - 1];
  return type || TYPES[0];
}

export function getComponentTypeFromArray(typedArray) {
  const componentType = ARRAY_TO_COMPONENT_TYPE.get(typedArray.constructor);
  if (!componentType) {
    throw new Error('Illegal typed array');
  }
  return componentType;
}

export function getAccessorArrayTypeAndLength(accessor, bufferView) {
  const ArrayType = ATTRIBUTE_COMPONENT_TYPE_TO_ARRAY[accessor.componentType];
  const components = ATTRIBUTE_TYPE_TO_COMPONENTS[accessor.type];
  const bytesPerComponent = ATTRIBUTE_COMPONENT_TYPE_TO_BYTE_SIZE[accessor.componentType];
  const length = accessor.count * components;
  const byteLength = accessor.count * components * bytesPerComponent;
  assert(byteLength >= 0 && byteLength <= bufferView.byteLength);
  const componentByteSize = BYTES[accessor.componentType];
  const numberOfComponentsInElement = COMPONENTS[accessor.type];
  return {ArrayType, length, byteLength, componentByteSize, numberOfComponentsInElement};
}

/**
 * Calculate the GPU memory used by a GLTF tile, for both buffer and texture memory
 * @param gltf - the gltf content of a GLTF tile
 * @returns - total memory usage in bytes
 */
export function getMemoryUsageGLTF(gltf: GLTFWithBuffers): number {
  const imageBufferViews = new Set((gltf.json.images || []).map(image => image.bufferView));
  const liveBufferViews = new Set<number>();
  const decodedValues = new Set<ArrayBufferView>();
  const accessors = new Set<GLTFAccessor>();
  let materializedMemory = 0;
  /** Count current accessor storage without reading or allocating its values. */
  const addAccessorStorage = (reference: number | GLTFAccessor | undefined): void => {
    const accessor = typeof reference === 'number' ? gltf.json.accessors?.[reference] : reference;
    if (!accessor || accessors.has(accessor)) return;
    accessors.add(accessor);
    const value = (accessor as GLTFAccessor & {value?: ArrayBufferView}).value;
    if (ArrayBuffer.isView(value)) {
      if (!decodedValues.has(value)) materializedMemory += value.byteLength;
      decodedValues.add(value);
    } else if (accessor.sparse || accessor.bufferView === undefined) {
      materializedMemory +=
        accessor.count * BYTES[accessor.componentType] * COMPONENTS[accessor.type];
    } else {
      liveBufferViews.add(accessor.bufferView);
    }
  };
  for (const accessor of gltf.json.accessors || []) {
    // Unused Draco declarations can lack storage after decoding into inline accessors.
    if (accessor.bufferView !== undefined || accessor.sparse || 'value' in accessor)
      addAccessorStorage(accessor);
  }
  for (const mesh of gltf.json.meshes || []) {
    for (const primitive of mesh.primitives) {
      addAccessorStorage(primitive.indices);
      for (const reference of Object.values(primitive.attributes)) addAccessorStorage(reference);
      for (const target of primitive.targets || []) {
        for (const reference of Object.values(target)) addAccessorStorage(reference);
      }
    }
  }
  const bufferMemory = [...liveBufferViews].reduce(
    (total, index) =>
      total + (imageBufferViews.has(index) ? 0 : gltf.json.bufferViews?.[index]?.byteLength || 0),
    materializedMemory
  );
  const pixelCount = (gltf.images || []).reduce(
    (total, image) => total + ((image as any)?.width || 0) * ((image as any)?.height || 0),
    0
  );
  return bufferMemory + Math.ceil(4 * pixelCount * MIPMAP_FACTOR);
}
