// Contains Buffer references to a file that is only bundled under Node.js
/* global Buffer */
import assert from '../env-utils/assert';

/**
 * Convert Buffer to ArrayBuffer
 */
export function toArrayBuffer(buffer) {
  // TODO - per docs we should just be able to call buffer.buffer, but there are issues
  if (Buffer.isBuffer(buffer)) {
    const typedArray = new Uint8Array(buffer);
    return typedArray.buffer;
  }
  return buffer;
}

/**
 * Convert (copy) ArrayBuffer to Buffer
 */
export function toBuffer(binaryData) {
  if (ArrayBuffer.isView(binaryData)) {
    binaryData = binaryData.buffer;
  }

  if (typeof Buffer !== 'undefined' && binaryData instanceof ArrayBuffer) {
    const buffer = new Buffer(binaryData.byteLength);
    const view = new Uint8Array(binaryData);
    for (let i = 0; i < buffer.length; ++i) {
      buffer[i] = view[i];
    }
    return buffer;
  }

  return assert(false);
}
