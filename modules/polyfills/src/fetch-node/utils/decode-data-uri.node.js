// Based on binary-gltf-utils under MIT license: Copyright (c) 2016-17 Karl Cheng
// import path from 'path';
// const fs = module.require && module.require('fs');

// TODO consolidate with core-node
// TODO - remove dependency on Buffer

/* global Buffer */
import {toArrayBuffer} from './to-array-buffer.node';

/**
 * Parses a data URI into a buffer, as well as retrieving its declared MIME type.
 *
 * @param {string} uri - a data URI (assumed to be valid)
 * @returns {Object} { buffer, mimeType }
 */
export default function decodeDataUri(uri) {
  const dataIndex = uri.indexOf(',');

  let buffer;
  let mimeType;
  if (uri.slice(dataIndex - 7, dataIndex) === ';base64') {
    buffer = new Buffer(uri.slice(dataIndex + 1), 'base64');
    mimeType = uri.slice(5, dataIndex - 7).trim();
  } else {
    buffer = new Buffer(decodeURIComponent(uri.slice(dataIndex + 1)));
    mimeType = uri.slice(5, dataIndex).trim();
  }

  if (!mimeType) {
    mimeType = 'text/plain;charset=US-ASCII';
  } else if (mimeType.startsWith(';')) {
    mimeType = `text/plain${mimeType}`;
  }

  return {arrayBuffer: toArrayBuffer(buffer), mimeType};
}
