// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {isSharedArrayBuffer} from '../javascript-utils/is-type';
import * as node from '../node/buffer';

/**
 * Check for Node.js `Buffer` (without triggering bundler to include Buffer polyfill on browser)
 */
export function isBuffer(value: any): value is Buffer {
  return value && typeof value === 'object' && value.isBuffer;
}

/**
 * Converts to Node.js `Buffer` (without triggering bundler to include Buffer polyfill on browser)
 * @todo better data type
 */
export function toBuffer(data: unknown): Buffer {
  return node.toBuffer ? node.toBuffer(data as any) : (data as Buffer);
}

/**
 * Convert an object to an array buffer. Handles SharedArrayBuffers.
 */
export function toArrayBuffer(
  data: Buffer | ArrayBufferLike | ArrayBufferView | string | Blob
): ArrayBuffer {
  // Note: Should be called first, Buffers can trigger other detections below
  if (isBuffer(data)) {
    return node.toArrayBuffer(data);
  }

  if (data instanceof ArrayBuffer) {
    return data;
  }

  if (isSharedArrayBuffer(data)) {
    return copyToArrayBuffer(data);
  }

  // Node Buffers look like Uint8Arrays (Check isBuffer first)
  if (ArrayBuffer.isView(data)) {
    // TODO - ArrayBufferLike type mess
    const buffer = data.buffer as ArrayBuffer;
    if (data.byteOffset === 0 && data.byteLength === data.buffer.byteLength) {
      return buffer;
    }
    return buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
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

/** Ensure that SharedArrayBuffers are copied into ArrayBuffers */
export function ensureArrayBuffer(bufferSource: ArrayBufferLike | ArrayBufferView): ArrayBuffer {
  if (bufferSource instanceof ArrayBuffer) {
    return bufferSource;
  }

  if (isSharedArrayBuffer(bufferSource)) {
    return copyToArrayBuffer(bufferSource);
  }

  const {buffer, byteOffset, byteLength} = bufferSource;
  if (buffer instanceof ArrayBuffer && byteOffset === 0 && byteLength === buffer.byteLength) {
    return buffer;
  }
  return copyToArrayBuffer(buffer, byteOffset, byteLength);
}

/** Copies an ArrayBuffer or a section of an ArrayBuffer to a new ArrayBuffer, handles SharedArrayBuffers */
export function copyToArrayBuffer(
  buffer: ArrayBufferLike,
  byteOffset = 0,
  byteLength = buffer.byteLength - byteOffset
): ArrayBuffer {
  const view = new Uint8Array(buffer, byteOffset, byteLength);
  const copy = new Uint8Array(view.length);
  copy.set(view);
  return copy.buffer;
}

/** Convert an object to an ArrayBufferView, handles SharedArrayBuffers */
export function toArrayBufferView(
  data: ArrayBufferLike | ArrayBufferView
): ArrayBuffer | ArrayBufferView {
  if (ArrayBuffer.isView(data)) {
    return data;
  }

  // Create a view to support ArrayBufferLike sources such as SharedArrayBuffer
  return new Uint8Array(data);
}
