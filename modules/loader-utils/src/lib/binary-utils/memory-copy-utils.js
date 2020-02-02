export function padTo4Bytes(byteLength) {
  return (byteLength + 3) & ~3;
}

// Copy a view of an ArrayBuffer into new ArrayBuffer with byteOffset = 0
export function getZeroOffsetArrayBuffer(arrayBuffer, byteOffset, byteLength) {
  const subArray = byteLength
    ? new Uint8Array(arrayBuffer).subarray(byteOffset, byteOffset + byteLength)
    : new Uint8Array(arrayBuffer).subarray(byteOffset);
  const arrayCopy = new Uint8Array(subArray);
  return arrayCopy.buffer;
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
    sourceArray = new Uint8Array(source.buffer, srcByteOffset, srcByteLength);
  }

  // Pack buffer onto the big target array
  target.set(sourceArray, targetOffset);

  return targetOffset + padTo4Bytes(sourceArray.byteLength);
}
