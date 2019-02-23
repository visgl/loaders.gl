/* global FileReader, Blob, ArrayBuffer, Buffer */
import assert from '../utils/assert';
import {TextEncoder} from './text-encoding';

export const isArrayBuffer = x => x && x instanceof ArrayBuffer;
export const isBlob = x => x && typeof Blob !== 'undefined' && x instanceof Blob;
export const isBuffer = x => x && x instanceof Buffer;

export function toArrayBuffer(data) {
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

export function blobToArrayBuffer(blob) {
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

// Convert (copy) ArrayBuffer to Buffer
export function toBuffer(binaryData) {
  if (ArrayBuffer.isView(binaryData)) {
    binaryData = binaryData.buffer;
  }

  if (typeof Buffer !== 'undefined' && binaryData instanceof ArrayBuffer) {
    /* global Buffer */
    const buffer = new Buffer(binaryData.byteLength);
    const view = new Uint8Array(binaryData);
    for (let i = 0; i < buffer.length; ++i) {
      buffer[i] = view[i];
    }
    return buffer;
  }

  return assert(false);
}

export function toDataView(buffer) {
  return new DataView(toArrayBuffer(buffer));
}
