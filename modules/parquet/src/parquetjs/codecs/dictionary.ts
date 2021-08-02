import {decodeValues as decodeDictionaryValues} from './rle';

export function decodeValues(type, cursor, count, opts) {
  opts.bitWidth = cursor.buffer.slice(cursor.offset, cursor.offset + 1).readInt8(0);
  cursor.offset += 1;
  return decodeDictionaryValues(type, cursor, count, {...opts, disableEnvelope: true});
}

export function encodeValues(type, cursor, count, opts) {
  throw new Error('Encode dictionary functionality is not supported');
}
