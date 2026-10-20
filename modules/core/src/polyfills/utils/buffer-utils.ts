// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Convert a Node buffer, typed array, or ArrayBuffer-like value to an ArrayBuffer. */
export function toArrayBuffer(data: Buffer | ArrayBufferLike | ArrayBufferView): ArrayBuffer {
  if (data instanceof ArrayBuffer) {
    return data;
  }
  if (ArrayBuffer.isView(data)) {
    return ensureArrayBuffer(data);
  }
  return ensureArrayBuffer(data);
}

/** Return an ArrayBuffer without exposing pooled or shared backing memory. */
export function ensureArrayBuffer(data: ArrayBufferLike | ArrayBufferView): ArrayBuffer {
  if (data instanceof ArrayBuffer) {
    return data;
  }
  if (ArrayBuffer.isView(data)) {
    const {buffer, byteOffset, byteLength} = data;
    if (buffer instanceof ArrayBuffer && byteOffset === 0 && byteLength === buffer.byteLength) {
      return buffer;
    }
    return copyArrayBufferRange(buffer, byteOffset, byteLength);
  }
  return copyArrayBufferRange(data);
}

/** Copy a byte range into an ordinary ArrayBuffer. */
function copyArrayBufferRange(
  buffer: ArrayBufferLike,
  offset = 0,
  length = buffer.byteLength - offset
): ArrayBuffer {
  const copy = new Uint8Array(length);
  copy.set(new Uint8Array(buffer, offset, length));
  return copy.buffer;
}
