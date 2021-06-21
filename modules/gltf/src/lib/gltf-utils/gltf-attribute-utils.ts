// import type {TypedArray} from '../types/loader-utils';
import type {GLTFAccessor} from '../types/gltf-types';
// TODO - remove
import {getAccessorTypeFromSize, getComponentTypeFromArray} from './gltf-utils';

// Returns a fresh attributes object with glTF-standardized attributes names
// Attributes that cannot be identified will not be included
// Removes `indices` if present, as it should be stored separately from the attributes
export function getGLTFAccessors(attributes): {[key: string]: GLTFAccessor} {
  const accessors = {};
  for (const name in attributes) {
    const attribute = attributes[name];
    if (name !== 'indices') {
      const glTFAccessor = getGLTFAccessor(attribute);
      accessors[name] = glTFAccessor;
    }
  }
  return accessors;
}

// Fix up a single accessor.
// Input: typed array or a partial accessor object
// Return: accessor object
export function getGLTFAccessor(attribute) {
  const {buffer, size, count} = getAccessorData(attribute);

  const glTFAccessor: GLTFAccessor = {
    // glTF Accessor values
    // TODO: Instead of a bufferView index we could have an actual buffer (typed array)
    // bufferView: null,
    // TODO: Deprecate `value` in favor of bufferView?
    // @ts-ignore
    value: buffer,
    size, // Decoded `type` (e.g. SCALAR)

    byteOffset: 0,
    count,
    type: getAccessorTypeFromSize(size),
    componentType: getComponentTypeFromArray(buffer)
  };

  return glTFAccessor;
}

// export function getGLTFAttribute(data, gltfAttributeName): GLTFAccessor {
//   return data.attributes[data.glTFAttributeMap[gltfAttributeName]];
// }

function getAccessorData(attribute) {
  let buffer = attribute;
  let size = 1;
  let count = 0;

  if (attribute && attribute.value) {
    buffer = attribute.value;
    size = attribute.size || 1;
  }

  if (buffer) {
    if (!ArrayBuffer.isView(buffer)) {
      buffer = toTypedArray(buffer, Float32Array);
    }
    count = buffer.length / size;
  }

  return {buffer, size, count};
}

// Convert non-typed arrays to arrays of specified format
function toTypedArray(array, ArrayType, convertTypedArrays = false) {
  if (!array) {
    return null;
  }
  if (Array.isArray(array)) {
    return new ArrayType(array);
  }
  if (convertTypedArrays && !(array instanceof ArrayType)) {
    return new ArrayType(array);
  }
  return array;
}
