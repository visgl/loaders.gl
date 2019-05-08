"use strict";module.export({copyArrayBuffer:()=>copyArrayBuffer,copyPaddedArrayBufferToDataView:()=>copyPaddedArrayBufferToDataView,copyPaddedStringToDataView:()=>copyPaddedStringToDataView,padTo4Bytes:()=>padTo4Bytes,copyToArray:()=>copyToArray});var TextEncoder;module.link('@loaders.gl/core',{TextEncoder(v){TextEncoder=v}},0);

/* Copies two different ArrayBuffers
 * @param {ArrayBuffers} buffer1 The first buffer.
 * @param {ArrayBuffers} buffer2 The second buffer.
 * @return {ArrayBuffers} The new ArrayBuffer created out of the two.
 */
function copyArrayBuffer(
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

function copyPaddedArrayBufferToDataView(dataView, byteOffset, sourceBuffer, padding) {
  const paddedLength = padTo4Bytes(sourceBuffer.byteLength);
  const padLength = paddedLength - sourceBuffer.byteLength;

  if (dataView) {
    // Copy array
    const targetArray = new Uint8Array(
      dataView.buffer,
      dataView.byteOffset + byteOffset,
      sourceBuffer.byteLength
    );
    const sourceArray = new Uint8Array(sourceBuffer);
    targetArray.set(sourceArray);

    // Add PADDING
    for (let i = 0; i < padLength; ++i) {
      // json chunk is padded with spaces (ASCII 0x20)
      dataView.setUint8(byteOffset + sourceBuffer.byteLength + i, 0x20);
    }
  }
  byteOffset += paddedLength;
  return byteOffset;
}

function copyPaddedStringToDataView(dataView, byteOffset, string, padding) {
  const textEncoder = new TextEncoder('utf8');
  // PERFORMANCE IDEA: We encode twice, once to get size and once to store
  // PERFORMANCE IDEA: Use TextEncoder.encodeInto() to avoid temporary copy
  const stringBuffer = textEncoder.encode(string);

  byteOffset = copyPaddedArrayBufferToDataView(dataView, byteOffset, stringBuffer, padding);

  return byteOffset;
}

function padTo4Bytes(byteLength) {
  return (byteLength + 3) & ~3;
}

/**
 * Copy from source to target at the targetOffset
 *
 * @param {ArrayBuffer|TypedArray} source - The data to copy
 * @param {TypedArray} target - The destination to copy data into
 * @param {Number} targetOffset - The start offset into target to place the copied data
 *
 * @return {Number} Returns the new offset taking into account proper padding
 */
function copyToArray(source, target, targetOffset) {
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
