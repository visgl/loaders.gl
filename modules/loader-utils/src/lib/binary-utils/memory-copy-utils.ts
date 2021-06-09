import {assert} from '../env-utils/assert';
import {sliceArrayBuffer} from './array-buffer-utils';

/**
 * Calculate new size of an arrayBuffer to be aligned to an n-byte boundary
 * This function increases `byteLength` by the minimum delta,
 * allowing the total length to be divided by `padding`
 * @param byteLength
 * @param padding
 */
export function padToNBytes(byteLength: number, padding: number): number {
  assert(byteLength >= 0); // `Incorrect 'byteLength' value: ${byteLength}`
  assert(padding > 0); // `Incorrect 'padding' value: ${padding}`
  return (byteLength + (padding - 1)) & ~(padding - 1);
}

/**
 * Copy a view of an ArrayBuffer into new ArrayBuffer with byteOffset = 0
 * @param arrayBuffer
 * @param byteOffset
 * @param byteLength
 * @deprecated Use sliceArrayBuffer
 */
export function getZeroOffsetArrayBuffer(
  arrayBuffer: ArrayBuffer,
  byteOffset: number,
  byteLength?: number
): ArrayBuffer {
  return sliceArrayBuffer(arrayBuffer, byteOffset, byteLength);
}

/**
 * Creates a new Uint8Array based on two different ArrayBuffers
 * @param targetBuffer The first buffer.
 * @param sourceBuffer The second buffer.
 * @return The new ArrayBuffer created out of the two.
 */
export function copyArrayBuffer(
  targetBuffer: ArrayBuffer,
  sourceBuffer: ArrayBuffer,
  byteOffset: number,
  byteLength: number = sourceBuffer.byteLength
): ArrayBuffer {
  const targetArray = new Uint8Array(targetBuffer, byteOffset, byteLength);
  const sourceArray = new Uint8Array(sourceBuffer);
  targetArray.set(sourceArray);
  return targetBuffer;
}

/**
 * Copy from source to target at the targetOffset
 *
 * @param source - The data to copy
 * @param target - The destination to copy data into
 * @param targetOffset - The start offset into target to place the copied data
 * @returns the new offset taking into account proper padding
 */
export function copyToArray(source: ArrayBuffer | any, target: any, targetOffset: number): number {
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
