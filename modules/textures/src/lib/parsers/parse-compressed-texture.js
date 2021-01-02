import {parsePvr, PVR_CONSTANTS} from './parse-pvr';
import {parseDds, DDS_CONSTANTS} from './parse-dds';

export function parseCompressedTexture(data) {
  if (isPvr(data)) {
    return parsePvr(data);
  } else if (isDds(data)) {
    return parseDds(data);
  }
  return null;
}

function isPvr(data) {
  const header = new Uint32Array(data, 0, PVR_CONSTANTS.HEADER_LENGTH);
  const version = header[PVR_CONSTANTS.MAGIC_NUMBER_INDEX];

  return version === PVR_CONSTANTS.MAGIC_NUMBER || version === PVR_CONSTANTS.MAGIC_NUMBER_EXTRA;
}

function isDds(data) {
  const header = new Uint32Array(data, 0, DDS_CONSTANTS.HEADER_LENGTH);
  const magic = header[DDS_CONSTANTS.MAGIC_NUMBER_INDEX];

  return magic === DDS_CONSTANTS.MAGIC_NUMBER;
}
