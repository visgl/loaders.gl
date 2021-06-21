import type {TextureLevel} from '../../types';
import {isKTX, parseKTX} from './parse-ktx';
import {isDDS, parseDDS} from './parse-dds';
import {isPVR, parsePVR} from './parse-pvr';

/**
 * Deduces format and parses compressed texture loaded in ArrayBuffer
 * @param data - binary data of compressed texture
 * @returns Array of the texture levels
 */
export function parseCompressedTexture(data: ArrayBuffer): TextureLevel[] {
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
