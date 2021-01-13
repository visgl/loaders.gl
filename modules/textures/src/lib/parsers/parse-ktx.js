import {read} from 'ktx-parse';

export function parseKTX(arrayBuffer) {
  const uint8Array = new Uint8Array(arrayBuffer);

  const ktx = read(uint8Array);

  // TBA - post process

  return ktx;
}
