// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Isolates Buffer references to ensure they are only bundled under Node.js (avoids big webpack polyfill)
// this file is selected by the package.json "browser" field).

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
export function toBuffer(binaryData: ArrayBuffer | Buffer): Buffer {
  if (Buffer.isBuffer(binaryData)) {
    return binaryData;
  }

  if (ArrayBuffer.isView(binaryData)) {
    binaryData = binaryData.buffer;
  }

  // TODO - move to loaders.gl/polyfills
  if (typeof Buffer !== 'undefined' && binaryData instanceof ArrayBuffer) {
    return Buffer.from(binaryData);
  }

  throw new Error('toBuffer');
}
