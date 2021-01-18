import {read} from 'ktx-parse';

export function encodeKTX(texture) {
  const ktx = read(texture);
  // post process
  return ktx;
}
