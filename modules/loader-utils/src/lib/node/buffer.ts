// Isolates Buffer references to ensure they are only bundled under Node.js (avoids big webpack polyfill)
// this file is not visible to webpack (it is excluded in the package.json "browser" field).

/**
 * Convert Buffer to ArrayBuffer
 * Converts Node.js `Buffer` to `ArrayBuffer` (without triggering bundler to include Buffer polyfill on browser)
 * @todo better data type
 */
export function toArrayBuffer(buffer) {
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
export function toBuffer(binaryData: ArrayBuffer | ArrayBuffer | Buffer): Buffer {
  if (Buffer.isBuffer(binaryData)) {
    return binaryData;
  }

  if (ArrayBuffer.isView(binaryData)) {
    binaryData = binaryData.buffer;
  }

  if (typeof Buffer !== 'undefined' && binaryData instanceof ArrayBuffer) {
    return Buffer.from(binaryData);
  }

  throw new Error('toBuffer');
}
