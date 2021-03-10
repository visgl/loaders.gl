/** @typedef {import('./array-buffer-utils')} types */
/* global TextEncoder */
import {assert} from '../env-utils/assert';
import * as node from '../node/buffer-utils.node';

/** @type {types['toArrayBuffer']} */
export function toArrayBuffer(data) {
  // Note: Should be called first, Buffers can trigger other detections below
  if (node.toArrayBuffer) {
    // TODO - per docs we should just be able to call buffer.buffer, but there are issues
    data = node.toArrayBuffer(data);
  }

  if (data instanceof ArrayBuffer) {
    return data;
  }

  // Careful - Node Buffers will look like ArrayBuffers (keep after isBuffer)
  if (ArrayBuffer.isView(data)) {
    return data.buffer;
  }

  if (typeof data === 'string') {
    const text = data;
    const uint8Array = new TextEncoder().encode(text);
    return uint8Array.buffer;
  }

  // HACK to support Blob polyfill
  if (data && typeof data === 'object' && data._toArrayBuffer) {
    return data._toArrayBuffer();
  }

  return assert(false);
}

/** @type {types['compareArrayBuffers']} */
export function compareArrayBuffers(arrayBuffer1, arrayBuffer2, byteLength) {
  byteLength = byteLength || arrayBuffer1.byteLength;
  if (arrayBuffer1.byteLength < byteLength || arrayBuffer2.byteLength < byteLength) {
    return false;
  }
  const array1 = new Uint8Array(arrayBuffer1);
  const array2 = new Uint8Array(arrayBuffer2);
  for (let i = 0; i < array1.length; ++i) {
    if (array1[i] !== array2[i]) {
      return false;
    }
  }
  return true;
}

// Concatenate ArrayBuffers
/** @type {types['concatenateArrayBuffers']} */
export function concatenateArrayBuffers(...sources) {
  // Make sure all inputs are wrapped in typed arrays
  const sourceArrays = sources.map(
    source2 => (source2 instanceof ArrayBuffer ? new Uint8Array(source2) : source2)
  );

  // Get length of all inputs
  const byteLength = sourceArrays.reduce((length, typedArray) => length + typedArray.byteLength, 0);

  // Allocate array with space for all inputs
  const result = new Uint8Array(byteLength);

  // Copy the subarrays
  let offset = 0;
  for (const sourceArray of sourceArrays) {
    result.set(sourceArray, offset);
    offset += sourceArray.byteLength;
  }

  // We work with ArrayBuffers, discard the typed array wrapper
  return result.buffer;
}
// Concatenate arbitrary count of typed arrays
export function concatenateTypedArrays(...arrays) {
  const TypedArrayConstructor = (arrays && arrays.length > 1 && arrays[0].constructor) || null;
  if (!TypedArrayConstructor) {
    throw new Error(
      '"concatenateTypedArrays" - incorrect quantity of arguments or arguments have incompatible data types'
    );
  }

  const sumLength = arrays.reduce((acc, value) => acc + value.length, 0);
  const result = new TypedArrayConstructor(sumLength);
  let offset = 0;
  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }
  return result;
}

// Copy a view of an ArrayBuffer into new ArrayBuffer with byteOffset = 0
export function sliceArrayBuffer(arrayBuffer, byteOffset, byteLength) {
  const subArray =
    byteLength !== undefined
      ? new Uint8Array(arrayBuffer).subarray(byteOffset, byteOffset + byteLength)
      : new Uint8Array(arrayBuffer).subarray(byteOffset);
  const arrayCopy = new Uint8Array(subArray);
  return arrayCopy.buffer;
}
