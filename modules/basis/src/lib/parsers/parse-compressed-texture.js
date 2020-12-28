import {parsePvr} from './parse-pvr';

const HEADER_LENGTH = 13;

export function parseCompressedTexture(data) {
  if (isPvr(data)) {
    return parsePvr(data);
  }
  return null;
}
function isPvr(data) {
  const header = new Uint32Array(data, 0, HEADER_LENGTH);
  const version = header[0];

  if (version === 0x03525650 || version === 0x50565203) {
    return true;
  }
  return false;
}
