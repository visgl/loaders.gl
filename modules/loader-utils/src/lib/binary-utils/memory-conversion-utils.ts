// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

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
 * Convert an object to an array buffer
 */
export function toArrayBuffer(data: unknown): ArrayBuffer {
  // Note: Should be called first, Buffers can trigger other detections below
  if (isBuffer(data)) {
    return node.toArrayBuffer(data);
  }

  if (data instanceof ArrayBuffer) {
    return data;
  }

  // Careful - Node Buffers look like Uint8Arrays (keep after isBuffer)
  if (ArrayBuffer.isView(data)) {
    if (data.byteOffset === 0 && data.byteLength === data.buffer.byteLength) {
      return data.buffer;
    }
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  }

  if (typeof data === 'string') {
    const text = data;
    const uint8Array = new TextEncoder().encode(text);
    return uint8Array.buffer;
  }

  // HACK to support Blob polyfill
  if (data && typeof data === 'object' && (data as any)._toArrayBuffer) {
    return (data as any)._toArrayBuffer();
  }

  throw new Error('toArrayBuffer');
}
