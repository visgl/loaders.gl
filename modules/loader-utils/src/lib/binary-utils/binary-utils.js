/* global TextEncoder */
import assert from '../env-utils/assert';
import * as node from '../node/buffer-utils.node';

export function toArrayBuffer(data) {
  // Note: Should be called first, Buffers can trigger other detections below
  if (node.toArrayBuffer) {
    // TODO - per docs we should just be able to call buffer.buffer, but there are issues
    data = node.toArrayBuffer(data);
  }

  if (data instanceof ArrayBuffer) {
    return data;
  }

  // Careful - Node Buffers will look like ArrayBuffers (keep after isBuffer)
  if (ArrayBuffer.isView(data)) {
    return data.buffer;
  }

  if (typeof data === 'string') {
    const text = data;
    const uint8Array = new TextEncoder().encode(text);
    return uint8Array.buffer;
  }

  return assert(false);
}

export function toBuffer(data) {
  return node.toBuffer ? node.toBuffer(data) : data;
}
