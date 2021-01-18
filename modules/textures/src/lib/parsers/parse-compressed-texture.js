/** @typedef {import('./parse-compressed-texture')} types */
import {isKTX, parseKTX} from './parse-ktx';
import {isDDS, parseDDS} from './parse-dds';
import {isPVR, parsePVR} from './parse-pvr';

/** @type {types['parseCompressedTexture']} */
export function parseCompressedTexture(data) {
  if (isKTX(data)) {
    // TODO: remove @ts-ignore when `parseKTX` output is normalized to loaders.gl texture format
    // @ts-ignore
    return parseKTX(data);
  }
  if (isDDS(data)) {
    return parseDDS(data);
  }
  if (isPVR(data)) {
    return parsePVR(data);
  }
  throw new Error('Texture container format not recognized');
}
