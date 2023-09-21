import {assert} from '../utils/assert';

import type {GLTFWithBuffers} from '../types/gltf-types';
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
  return {ArrayType, length, byteLength};
}

export function getFloat32ArrayForAccessor(gltfData: GLTFWithBuffers, texCoordAccessor: number): Float32Array | null {
  const accessor = gltfData.json.accessors?.[texCoordAccessor];
  if (accessor && accessor.bufferView) {
    // Get `bufferView` of the `accessor`
    const bufferView = gltfData.json.bufferViews?.[accessor.bufferView];
    if (bufferView) {
      // Get `arrayBuffer` the `bufferView` look at
      const {arrayBuffer, byteOffset: bufferByteOffset} = gltfData.buffers[bufferView.buffer];
      // Resulting byteOffset is sum of the buffer, accessor and bufferView byte offsets
      const byteOffset =
        (bufferByteOffset || 0) + (accessor.byteOffset || 0) + (bufferView.byteOffset || 0);
      // Deduce TypedArray type and its length from `accessor` and `bufferView` data
      const {ArrayType, length} = getAccessorArrayTypeAndLength(accessor, bufferView);
      // Number of bytes each component occupies
      const bytes = BYTES[accessor.componentType];
      // Number of components. For the `TEXCOORD_0` with `VEC2` type, it must return 2
      const components = COMPONENTS[accessor.type];
      // Multiplier to calculate the address of the `TEXCOORD_0` element in the arrayBuffer
      const elementAddressScale = bufferView.byteStride || bytes * components;
      // Data transform to Float32Array
      const result = new Float32Array(length);
      for (let i = 0; i < accessor.count; i++) {
        // Take [u, v] couple from the arrayBuffer
        const uv = new ArrayType(arrayBuffer, byteOffset + i * elementAddressScale, 2);
        result.set(uv, i * components);
      }
      return result;
    }
  }
  return null;
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
