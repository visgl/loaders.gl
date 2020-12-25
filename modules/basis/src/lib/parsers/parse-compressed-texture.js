import {parsePvr} from './parse-pvr';

export function parseCompressedTexture(data) {
  if (isPvr(data)) {
    return parsePvr(data);
  }
  return null;
}
function isPvr(data) {
  const array = new Uint32Array(data);
  const version = array[0];
  if (version === 0x03525650 || version === 0x50565203) {
    return true;
  }
  return false;
}
