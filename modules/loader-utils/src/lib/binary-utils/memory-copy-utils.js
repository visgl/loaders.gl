import {assert} from '../env-utils/assert';
import {sliceArrayBuffer} from './array-buffer-utils';

export function padToNBytes(byteLength, padding) {
  assert(byteLength >= 0); // `Incorrect 'byteLength' value: ${byteLength}`
  assert(padding > 0); // `Incorrect 'padding' value: ${padding}`
  return (byteLength + (padding - 1)) & ~(padding - 1);
}

export function getZeroOffsetArrayBuffer(arrayBuffer, byteOffset, byteLength) {
  return sliceArrayBuffer(arrayBuffer, byteOffset, byteLength);
}

/* Creates a new Uint8Array based on two different ArrayBuffers
 * @private
 * @param {ArrayBuffers} buffer1 The first buffer.
 * @param {ArrayBuffers} buffer2 The second buffer.
 * @return {ArrayBuffers} The new ArrayBuffer created out of the two.
 */
export function copyArrayBuffer(
  targetBuffer,
  sourceBuffer,
  byteOffset,
  byteLength = sourceBuffer.byteLength
) {
  const targetArray = new Uint8Array(targetBuffer, byteOffset, byteLength);
  const sourceArray = new Uint8Array(sourceBuffer);
  targetArray.set(sourceArray);
  return targetBuffer;
}

/**
 * Copy from source to target at the targetOffset
 *
 * @param {ArrayBuffer|any} source - The data to copy
 * @param {any} target - The destination to copy data into
 * @param {Number} targetOffset - The start offset into target to place the copied data
 *
 * @return {Number} Returns the new offset taking into account proper padding
 */
export function copyToArray(source, target, targetOffset) {
  let sourceArray;

  if (source instanceof ArrayBuffer) {
    sourceArray = new Uint8Array(source);
  } else {
    // Pack buffer onto the big target array
    //
    // 'source.data.buffer' could be a view onto a larger buffer.
    // We MUST use this constructor to ensure the byteOffset and byteLength is
    // set to correct values from 'source.data' and not the underlying
    // buffer for target.set() to work properly.
    const srcByteOffset = source.byteOffset;
    const srcByteLength = source.byteLength;
    // In gltf parser it is set as "arrayBuffer" instead of "buffer"
    // https://github.com/visgl/loaders.gl/blob/1e3a82a0a65d7b6a67b1e60633453e5edda2960a/modules/gltf/src/lib/parse-gltf.js#L85
    sourceArray = new Uint8Array(source.buffer || source.arrayBuffer, srcByteOffset, srcByteLength);
  }

  // Pack buffer onto the big target array
  target.set(sourceArray, targetOffset);

  return targetOffset + padToNBytes(sourceArray.byteLength, 4);
}
