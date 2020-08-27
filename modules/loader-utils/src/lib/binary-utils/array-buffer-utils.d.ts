// TODO better data type
export function toArrayBuffer(data: any): ArrayBuffer;

/**
 * Copy a view of an ArrayBuffer into new ArrayBuffer with byteOffset = 0
 * @param arrayBuffer
 * @param byteOffset
 * @param byteLength
 */
export function sliceArrayBuffer(arrayBuffer: ArrayBuffer, byteOffset: number, byteLength?: number): ArrayBuffer;

/**
 * compare two binary arrays for equality
 * @param {ArrayBuffer} a
 * @param {ArrayBuffer} b
 * @param {number} byteLength
 */
export function compareArrayBuffers(arrayBuffer1: ArrayBuffer, arrayBuffer2: ArrayBuffer, byteLength?: number);

/**
 * Concatenate a sequence of ArrayBuffers
 * @return A concatenated ArrayBuffer
 */
export function concatenateArrayBuffers(
  ...sources: (ArrayBuffer | Uint8Array)[]
): ArrayBuffer;

/**
 * Concatenate arbitrary count of typed arrays
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays
 *
 * @param {...*} arrays - list of arrays. All arrays should be the same type
 *
 * @return A concatenated TypedArray 
  */
 export function concatenateTypedArrays<T>(...arrays: T[]): T;
