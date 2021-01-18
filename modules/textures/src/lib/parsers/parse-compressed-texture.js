import {isKTX, parseKTX} from './parse-ktx';
import {isDDS, parseDDS} from './parse-dds';
import {isPVR, parsePVR} from './parse-pvr';

export function parseCompressedTexture(data) {
  if (isKTX(data)) {
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
