"use strict";module.export({bufferToArrayBufferNode:()=>bufferToArrayBufferNode});/* global Buffer */

function bufferToArrayBufferNode(buffer) {
  // TODO - per docs we should just be able to call buffer.buffer, but there are issues
  if (Buffer.isBuffer(buffer)) {
    const typedArray = new Uint8Array(buffer);
    return typedArray.buffer;
  }
  return buffer;
}
