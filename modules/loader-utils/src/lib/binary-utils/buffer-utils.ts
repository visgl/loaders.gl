import * as node from '../node/buffer-utils.node';

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
export function bufferToArrayBuffer(data: any): ArrayBuffer {
  if (node.toArrayBuffer) {
    // TODO - per docs we should just be able to call buffer.buffer, but there are issues
    return node.toArrayBuffer(data);
  }
  return data;
}
