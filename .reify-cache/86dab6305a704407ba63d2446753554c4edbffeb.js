"use strict";module.export({toArrayBuffer:()=>toArrayBuffer,blobToArrayBuffer:()=>blobToArrayBuffer,toDataView:()=>toDataView});module.export({isArrayBuffer:()=>isArrayBuffer,isBlob:()=>isBlob,isBuffer:()=>isBuffer},true);var assert;module.link('../utils/assert',{default(v){assert=v}},0);var TextEncoder;module.link('./text-encoding',{TextEncoder(v){TextEncoder=v}},1);/* global FileReader, Blob, ArrayBuffer, Buffer */



const isArrayBuffer = x => x && x instanceof ArrayBuffer;
const isBlob = x => x && typeof Blob !== 'undefined' && x instanceof Blob;
const isBuffer = x => x && x instanceof Buffer;

function toArrayBuffer(data) {
  if (isArrayBuffer(data)) {
    return data;
  }

  // TODO - per docs we should just be able to call buffer.buffer, but there are issues
  if (isBuffer(data)) {
    const typedArray = new Uint8Array(data);
    return typedArray.buffer;
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

function blobToArrayBuffer(blob) {
  return new Promise((resolve, reject) => {
    let arrayBuffer;
    const fileReader = new FileReader();
    fileReader.onload = event => {
      arrayBuffer = event.target.result;
    };
    fileReader.onloadend = event => resolve(arrayBuffer);
    fileReader.onerror = reject;
    fileReader.readAsArrayBuffer(blob);
  });
}

function toDataView(buffer) {
  return new DataView(toArrayBuffer(buffer));
}
