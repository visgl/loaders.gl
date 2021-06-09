// Based on binary-gltf-utils under MIT license: Copyright (c) 2016-17 Karl Cheng

import {assert} from '../../utils/assert';

const isArrayBuffer = (x) => x && x instanceof ArrayBuffer;
const isBuffer = (x) => x && x instanceof Buffer;

/**
 * Parses a data URI into a buffer, as well as retrieving its declared MIME type.
 *
 * @param {string} uri - a data URI (assumed to be valid)
 * @returns {Object} { buffer, mimeType }
 */
export function decodeDataUri(uri) {
  const dataIndex = uri.indexOf(',');

  let buffer;
  let mimeType;
  if (uri.slice(dataIndex - 7, dataIndex) === ';base64') {
    buffer = Buffer.from(uri.slice(dataIndex + 1), 'base64');
    mimeType = uri.slice(5, dataIndex - 7).trim();
  } else {
    buffer = Buffer.from(decodeURIComponent(uri.slice(dataIndex + 1)));
    mimeType = uri.slice(5, dataIndex).trim();
  }

  if (!mimeType) {
    mimeType = 'text/plain;charset=US-ASCII';
  } else if (mimeType.startsWith(';')) {
    mimeType = `text/plain${mimeType}`;
  }

  return {arrayBuffer: toArrayBuffer(buffer), mimeType};
}

/**
 * @param data
 * @todo Duplicate of core
 */
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

  // HACK to support Blob polyfill
  if (data && typeof data === 'object' && data._toArrayBuffer) {
    return data._toArrayBuffer();
  }

  return assert(false, `toArrayBuffer(${JSON.stringify(data, null, 2).slice(10)})`);
}
