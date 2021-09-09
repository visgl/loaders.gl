import * as node from '../node/buffer';

/**
 * Check for Node.js `Buffer` (without triggering bundler to include Buffer polyfill on browser)
 */
export function isBuffer(value: any): boolean {
  return value && typeof value === 'object' && value.isBuffer;
}

/**
 * Converts to Node.js `Buffer` (without triggering bundler to include Buffer polyfill on browser)
 * @todo better data type
 */
export function toBuffer(data: any): Buffer {
  return node.toBuffer ? node.toBuffer(data) : data;
}

/**
 * Converts Node.js `Buffer` to `ArrayBuffer` (without triggering bundler to include Buffer polyfill on browser)
 * @todo better data type
 */
export function bufferToArrayBuffer(buffer: any): ArrayBuffer {
  if (isBuffer(buffer)) {
    const typedArray = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.length);
    return typedArray.slice().buffer;
  }
  return buffer;
}
