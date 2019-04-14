// HELPER ENCODERS
import {assert} from '@loaders.gl/core';

export function encode3DTileHeader(buffer, byteOffset, options) {
  const HEADER_SIZE = 12;

  if (!buffer) {
    return {byteOffset: byteOffset + HEADER_SIZE};
  }

  const {magic, version = 1, byteLength} = options;

  assert(Array.isArray(magic) && Number.isFinite(version) && Number.isFinite(byteLength));

  const view = new DataView(buffer);
  view.setUint8(byteOffset + 0, magic[0]);
  view.setUint8(byteOffset + 1, magic[1]);
  view.setUint8(byteOffset + 2, magic[2]);
  view.setUint8(byteOffset + 3, magic[3]);
  view.setUint32(byteOffset + 4, version, true); // version
  view.setUint32(byteOffset + 8, byteLength, true); // byteLength

  byteOffset += HEADER_SIZE;

  return {buffer, byteOffset};
}
