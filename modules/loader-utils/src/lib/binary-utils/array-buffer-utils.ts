import {TypedArray} from '../../types';

/**
 * compare two binary arrays for equality
 * @param a
 * @param b
 * @param byteLength
 */
export function compareArrayBuffers(
  arrayBuffer1: ArrayBuffer,
  arrayBuffer2: ArrayBuffer,
  byteLength?: number
): boolean {
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

/**
 * Concatenate a sequence of ArrayBuffers
 * @return A concatenated ArrayBuffer
 */
export function concatenateArrayBuffers(...sources: (ArrayBuffer | Uint8Array)[]): ArrayBuffer {
  // Make sure all inputs are wrapped in typed arrays
  const sourceArrays = sources.map((source2) =>
    source2 instanceof ArrayBuffer ? new Uint8Array(source2) : source2
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

/**
 * Concatenate arbitrary count of typed arrays
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays
 * @param - list of arrays. All arrays should be the same type
 * @return A concatenated TypedArray
 */
export function concatenateTypedArrays<T>(...typedArrays: T[]): T {
  // @ts-ignore
  const arrays = typedArrays as TypedArray[];
  // @ts-ignore
  const TypedArrayConstructor = (arrays && arrays.length > 1 && arrays[0].constructor) || null;
  if (!TypedArrayConstructor) {
    throw new Error(
      '"concatenateTypedArrays" - incorrect quantity of arguments or arguments have incompatible data types'
    );
  }

  const sumLength = arrays.reduce((acc, value) => acc + value.length, 0);
  // @ts-ignore typescript does not like dynamic constructors
  const result = new TypedArrayConstructor(sumLength);
  let offset = 0;
  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }
  return result;
}

/**
 * Copy a view of an ArrayBuffer into new ArrayBuffer with byteOffset = 0
 * @param arrayBuffer
 * @param byteOffset
 * @param byteLength
 */
export function sliceArrayBuffer(
  arrayBuffer: ArrayBuffer,
  byteOffset: number,
  byteLength?: number
): ArrayBuffer {
  const subArray =
    byteLength !== undefined
      ? new Uint8Array(arrayBuffer).subarray(byteOffset, byteOffset + byteLength)
      : new Uint8Array(arrayBuffer).subarray(byteOffset);
  const arrayCopy = new Uint8Array(subArray);
  return arrayCopy.buffer;
}
