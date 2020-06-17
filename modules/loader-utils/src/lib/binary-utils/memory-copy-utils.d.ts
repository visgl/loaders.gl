/**
 *
 * @param byteLength
 */
export function padTo4Bytes(byteLength: number): number;

/**
 * Copy a view of an ArrayBuffer into new ArrayBuffer with byteOffset = 0
 * @param arrayBuffer
 * @param byteOffset
 * @param byteLength
 * @deprecated Use sliceArrayBuffer
 */ 
export function getZeroOffsetArrayBuffer(arrayBuffer: ArrayBuffer, byteOffset: number, byteLength?: number);

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
  byteLength?: number
): ArrayBuffer;

/**
 * Copy from source to target at the targetOffset
 *
 * @param source - The data to copy
 * @param target - The destination to copy data into
 * @param targetOffset - The start offset into target to place the copied data
 *
 * @return the new offset taking into account proper padding
 */
export function copyToArray(source: ArrayBuffer | any, target: any, targetOffset: number): number;
