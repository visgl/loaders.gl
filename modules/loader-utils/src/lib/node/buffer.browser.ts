// loaders.gl, MIT license

// Isolates Buffer references to ensure they are only bundled under Node.js (avoids big webpack polyfill)
// this file is selected by the package.json "browser" field).

/**
 * Convert Buffer to ArrayBuffer
 * Converts Node.js `Buffer` to `ArrayBuffer` (without triggering bundler to include Buffer polyfill on browser)
 * @todo better data type
 */
export function toArrayBuffer(buffer) {
  return buffer;
}

/**
 * Convert (copy) ArrayBuffer to Buffer
 */
export function toBuffer(binaryData: ArrayBuffer | ArrayBuffer | Buffer): Buffer {
  throw new Error('Buffer not supported in browser');
}
