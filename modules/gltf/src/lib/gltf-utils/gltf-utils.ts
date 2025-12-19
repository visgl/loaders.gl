import {assert} from '../utils/assert';

import type {GLTFPostprocessed} from '../types/gltf-postprocessed-schema';
import {BYTES, COMPONENTS} from '../gltf-utils/gltf-constants';

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
  | Float64ArrayConstructor;

const ARRAY_CONSTRUCTOR_TO_WEBGL_CONSTANT: [TypedArrayConstructor, number][] = [
  [Int8Array, 5120],
  [Uint8Array, 5121],
  [Int16Array, 5122],
  [Uint16Array, 5123],
  [Uint32Array, 5125],
  [Float32Array, 5126],
  [Float64Array, 5130]
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
  5125: 4,
  5126: 4
};

const ATTRIBUTE_COMPONENT_TYPE_TO_ARRAY = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array
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
export function getMemoryUsageGLTF(gltf: GLTFPostprocessed): number {
  let {images, bufferViews} = gltf;
  images = images || [];
  bufferViews = bufferViews || [];
  const imageBufferViews = images.map((i) => i.bufferView);
  bufferViews = bufferViews.filter((view) => !imageBufferViews.includes(view as any));

  const bufferMemory = bufferViews.reduce((acc, view) => acc + view.byteLength, 0);

  // Assume each pixel of the texture is 4 channel with mimmaps (which add 33%)
  // TODO correctly handle compressed textures
  const pixelCount = images.reduce((acc, image) => {
    // @ts-ignore
    const {width, height} = (image as any).image;
    return acc + width * height;
  }, 0);
  return bufferMemory + Math.ceil(4 * pixelCount * MIPMAP_FACTOR);
}
