// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

// Based on binary-gltf-utils under MIT license: Copyright (c) 2016-17 Karl Cheng
import {toArrayBuffer} from '@loaders.gl/loader-utils';

/**
 * Parses a data URI into a buffer, as well as retrieving its declared MIME type.
 *
 * @param {string} uri - a data URI (assumed to be valid)
 * @returns {Object} { buffer, mimeType }
 */
export function decodeDataUri(uri: string): {arrayBuffer: ArrayBuffer; mimeType: string} {
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
