// Attributions
// * Based on binary-gltf-utils under MIT license: Copyright (c) 2016-17 Karl Cheng

import {toDataView} from './binary-utils';

const BIG_ENDIAN = false;
const LITTLE_ENDIAN = true;

const mimeTypeMap = new Map([
  ['image/png', getPngSize],
  ['image/jpeg', getJpegSize],
  ['image/gif', getGifSize],
  ['image/bmp', getBmpSize]
]);

const ERR_INVALID_TYPE = `Invalid MIME type. Supported MIME types are: ${Array.from(
  mimeTypeMap.keys()
).join(', ')}`;

export function isImage(contents) {
  const result = _getImageSize(contents);
  if (result) {
    // Seems not :(
    return result.mimeType;
  }
  return false;
}

/**
 * Sniffs the contents of a file to attempt to deduce the image type and extract image size.
 * Supported image types are PNG, JPEG, GIF and BMP.
 *
 * @param {Buffer} contents
 * @param {string} [mimeType]
 */
export function getImageSize(contents, mimeType) {
  // Looking for only a specific MIME type.
  if (mimeType) {
    const handler = mimeTypeMap.get(mimeType);
    if (!handler) {
      throw new Error(ERR_INVALID_TYPE);
    }

    const result = handler(contents);
    if (!result) {
      throw new Error(`invalid image data for type: ${mimeType}`);
    }
    return result;
  }

  const result = _getImageSize(contents, mimeType);
  if (!result) {
    // Seems not :(
    throw new Error(ERR_INVALID_TYPE);
  }
  return result;
}

function _getImageSize(contents, mimeType) {
  // Loop through each file type and see if they work.
  for (const [supportedMimeType, handler] of mimeTypeMap.entries()) {
    const result = handler(contents);
    if (result) {
      result.mimeType = supportedMimeType;
      return result;
    }
  }

  return null;
}

/**
 * Extract size from a binary PNG file
 * @param {Buffer} contents
 */
function getPngSize(contents) {
  const dataView = toDataView(contents);

  // Check file contains the first 4 bytes of the PNG signature.
  if (dataView.byteLength < 24 || dataView.getUint32(0, BIG_ENDIAN) !== 0x89504e47) {
    return null;
  }

  return {
    width: dataView.getUint32(16, BIG_ENDIAN),
    height: dataView.getUint32(20, BIG_ENDIAN)
  };
}

/**
 * Extract size from a binary GIF file
 * @param {Buffer} contents
 * TODO: GIF is not this simple
 */
function getGifSize(contents) {
  const dataView = toDataView(contents);

  // Check first 4 bytes of the GIF signature ("GIF8").
  if (dataView.byteLength < 10 || dataView.getUint32(0, BIG_ENDIAN) !== 0x47494638) {
    return null;
  }

  // GIF is little endian.
  return {
    width: dataView.getUint16(6, LITTLE_ENDIAN),
    height: dataView.getUint16(8, LITTLE_ENDIAN)
  };
}

/**
 * @param {Buffer} contents
 * TODO: BMP is not this simple
 */
function getBmpSize(contents) {
  const dataView = toDataView(contents);

  // Check magic number is valid (first 2 characters should be "BM").
  if (dataView.getUint16(0, BIG_ENDIAN) !== 0x424d) {
    return null;
  }

  // BMP is little endian.
  return {
    width: dataView.getUint32(18, LITTLE_ENDIAN),
    height: dataView.getUint32(22, LITTLE_ENDIAN)
  };
}

/**
 * Extract size from a binary JPEG file
 * @param {Buffer} contents
 */
function getJpegSize(contents) {
  const dataView = toDataView(contents);

  // Check file contains the JPEG "start of image" (SOI) marker.
  if (dataView.byteLength < 2 || dataView.getUint16(0, BIG_ENDIAN) !== 0xffd8) {
    return null;
  }

  const {tableMarkers, sofMarkers} = getJpegMarkers();

  // Exclude the two byte SOI marker.
  let i = 2;
  while (i < dataView.byteLength) {
    const marker = dataView.getUint16(i, BIG_ENDIAN);

    // The frame that contains the width and height of the JPEG image.
    if (sofMarkers.has(marker)) {
      return {
        height: dataView.getUint16(i + 5, BIG_ENDIAN), // Number of lines
        width: dataView.getUint16(i + 7, BIG_ENDIAN) // Number of pixels per line
      };
    }

    // Miscellaneous tables/data preceding the frame header.
    if (!tableMarkers.has(marker)) {
      return null;
    }

    // Length includes size of length parameter but not the two byte header.
    i += 2;
    i += dataView.getUint16(i, BIG_ENDIAN);
  }

  return null;
}

function getJpegMarkers() {
  // Tables/misc header markers.
  // DQT, DHT, DAC, DRI, COM, APP_n
  const tableMarkers = new Set([0xffdb, 0xffc4, 0xffcc, 0xffdd, 0xfffe]);
  for (let i = 0xffe0; i < 0xfff0; ++i) {
    tableMarkers.add(i);
  }

  // SOF markers and DHP marker.
  // These markers are after tables/misc data.
  const sofMarkers = new Set([
    0xffc0,
    0xffc1,
    0xffc2,
    0xffc3,
    0xffc5,
    0xffc6,
    0xffc7,
    0xffc9,
    0xffca,
    0xffcb,
    0xffcd,
    0xffce,
    0xffcf,
    0xffde
  ]);

  return {tableMarkers, sofMarkers};
}
