/**
 * Convert Buffer to ArrayBuffer
 */
export function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  // TODO - per docs we should just be able to call buffer.buffer, but there are issues
  if (Buffer.isBuffer(buffer)) {
    const typedArray = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.length);
    return typedArray.slice().buffer;
  }
  return buffer;
}

/**
 * Convert (copy) ArrayBuffer to Buffer
 */
export function toBuffer(arrayBuffer: ArrayBuffer): Buffer {
  return Buffer.from(arrayBuffer);
}
