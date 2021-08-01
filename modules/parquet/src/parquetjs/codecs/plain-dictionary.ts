import {decodeValues as decodeRleValues} from './rle';

export function decodeValues(type, cursor, count, opts) {
  opts.bitWidth = cursor.buffer.slice(cursor.offset, cursor.offset + 1).readInt8(0);
  cursor.offset += 1;
  return decodeRleValues(type, cursor, count, {...opts, disableEnvelope: true});
}

export function encodeValues(type, cursor, count, opts) {
  throw new Error('Encode plain dictionary functionality is not supported');
}
