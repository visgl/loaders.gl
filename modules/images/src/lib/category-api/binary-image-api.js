// Attributions
// * Based on binary-gltf-utils under MIT license: Copyright (c) 2016-17 Karl Cheng

// TODO: make these functions work for Node.js buffers?
// Quarantine references to Buffer to prevent bundler from adding big polyfills
// import {bufferToArrayBuffer} from '../node/buffer-to-array-buffer';
// TODO - this should be handled in @loaders.gl/polyfills

const BIG_ENDIAN = false;
const LITTLE_ENDIAN = true;

export function getBinaryImageMetadata(binaryData) {
  const dataView = toDataView(binaryData);
  return (
    getPngMetadata(dataView) ||
    getJpegMetadata(dataView) ||
    getGifMetadata(dataView) ||
    getBmpMetadata(dataView)
  );
}

// PNG

function getPngMetadata(binaryData) {
  const dataView = toDataView(binaryData);
  // Check file contains the first 4 bytes of the PNG signature.
  const isPng = dataView.byteLength >= 24 && dataView.getUint32(0, BIG_ENDIAN) === 0x89504e47;
  if (!isPng) {
    return null;
  }

  // Extract size from a binary PNG file
  return {
    mimeType: 'image/png',
    width: dataView.getUint32(16, BIG_ENDIAN),
    height: dataView.getUint32(20, BIG_ENDIAN)
  };
}

// GIF

// Extract size from a binary GIF file
// TODO: GIF is not this simple
function getGifMetadata(binaryData) {
  const dataView = toDataView(binaryData);
  // Check first 4 bytes of the GIF signature ("GIF8").
  const isGif = dataView.byteLength >= 10 && dataView.getUint32(0, BIG_ENDIAN) === 0x47494638;
  if (!isGif) {
    return null;
  }

  // GIF is little endian.
  return {
    mimeType: 'image/gif',
    width: dataView.getUint16(6, LITTLE_ENDIAN),
    height: dataView.getUint16(8, LITTLE_ENDIAN)
  };
}

// BMP

// TODO: BMP is not this simple
export function getBmpMetadata(binaryData) {
  const dataView = toDataView(binaryData);
  // Check magic number is valid (first 2 characters should be "BM").
  // The mandatory bitmap file header is 14 bytes long.
  const isBmp =
    dataView.byteLength >= 14 &&
    dataView.getUint16(0, BIG_ENDIAN) === 0x424d &&
    dataView.getUint32(2, LITTLE_ENDIAN) === dataView.byteLength;

  if (!isBmp) {
    return null;
  }

  // BMP is little endian.
  return {
    mimeType: 'image/bmp',
    width: dataView.getUint32(18, LITTLE_ENDIAN),
    height: dataView.getUint32(22, LITTLE_ENDIAN)
  };
}

// JPEG

// Extract width and height from a binary JPEG file
function getJpegMetadata(binaryData) {
  const dataView = toDataView(binaryData);
  // Check file contains the JPEG "start of image" (SOI) marker
  // followed by another marker.
  const isJpeg =
    dataView.byteLength >= 3 &&
    dataView.getUint16(0, BIG_ENDIAN) === 0xffd8 &&
    dataView.getUint8(2) === 0xff;

  if (!isJpeg) {
    return null;
  }

  const {tableMarkers, sofMarkers} = getJpegMarkers();

  // Exclude the two byte SOI marker.
  let i = 2;
  while (i + 9 < dataView.byteLength) {
    const marker = dataView.getUint16(i, BIG_ENDIAN);

    // The frame that contains the width and height of the JPEG image.
    if (sofMarkers.has(marker)) {
      return {
        mimeType: 'image/jpeg',
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
    0xffc0, 0xffc1, 0xffc2, 0xffc3, 0xffc5, 0xffc6, 0xffc7, 0xffc9, 0xffca, 0xffcb, 0xffcd, 0xffce,
    0xffcf, 0xffde
  ]);

  return {tableMarkers, sofMarkers};
}

// TODO - move into image module?
function toDataView(data) {
  if (data instanceof DataView) {
    return data;
  }
  if (ArrayBuffer.isView(data)) {
    return new DataView(data.buffer);
  }

  // TODO: make these functions work for Node.js buffers?
  // if (bufferToArrayBuffer) {
  //   data = bufferToArrayBuffer(data);
  // }

  // Careful - Node Buffers will look like ArrayBuffers (keep after isBuffer)
  if (data instanceof ArrayBuffer) {
    return new DataView(data);
  }
  throw new Error('toDataView');
}
