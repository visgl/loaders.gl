/* global TextEncoder */
import assert from '../env-utils/assert';
import * as nodeToArrayBuffer from '../node/to-array-buffer.node';
import * as nodeToBuffer from '../node/to-buffer.node';

export function toArrayBuffer(data) {
  if (nodeToArrayBuffer.bufferToArrayBuffer) {
    // TODO - per docs we should just be able to call buffer.buffer, but there are issues
    data = nodeToArrayBuffer.bufferToArrayBuffer(data);
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
  return nodeToBuffer.toNodeBuffer ? nodeToBuffer.toNodeBuffer(data) : data;
}
