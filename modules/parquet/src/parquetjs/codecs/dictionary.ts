// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 ironSource Ltd.
// Forked from https://github.com/kbajalc/parquets under MIT license

import {decodeValues as decodeRleValues} from './rle';

export function decodeValues(type, cursor, count, opts) {
  opts.bitWidth = cursor.buffer.slice(cursor.offset, cursor.offset + 1).readInt8(0);
  cursor.offset += 1;
  return decodeRleValues(type, cursor, count, {...opts, disableEnvelope: true});
}

export function encodeValues(type, cursor, count, opts) {
  throw new Error('Encode dictionary functionality is not supported');
}
