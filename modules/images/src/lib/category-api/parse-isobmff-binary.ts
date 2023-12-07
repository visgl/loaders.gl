// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// code adapted from https://github.com/sindresorhus/file-type under MIT license

/**
 * Box is a container format that can contain a variety of media related files,
 * so we want to return information about which type of file is actually contained inside
 */
export type BoxFileType = {extension: string; mimeType: string};

/**
 * Tests if a buffer is in ISO base media file format (ISOBMFF) @see https://en.wikipedia.org/wiki/ISO_base_media_file_format
 * (ISOBMFF is a media container standard based on the Apple QuickTime container format)
 */
export function getISOBMFFMediaType(buffer: Uint8Array): BoxFileType | null {
  // Almost all ISO base media files start with `ftyp` box. (It's not required to be first, but it's recommended to be.)
  if (!checkString(buffer, 'ftyp', 4)) {
    return null;
  }

  // Extra check: test for 8859-1 printable characters (for simplicity, it's a mask which also catches one non-printable character).
  if ((buffer[8] & 0x60) === 0x00) {
    return null;
  }

  // `ftyp` box must contain a brand major identifier, which must consist of ISO 8859-1 printable characters.
  return decodeMajorBrand(buffer);
}

/**
 * brands explained @see https://github.com/strukturag/libheif/issues/83
 * code adapted from @see https://github.com/sindresorhus/file-type/blob/main/core.js#L489-L492
 */
export function decodeMajorBrand(buffer: Uint8Array): BoxFileType | null {
  const brandMajor = getUTF8String(buffer, 8, 12).replace('\0', ' ').trim();

  switch (brandMajor) {
    case 'avif':
    case 'avis':
      return {extension: 'avif', mimeType: 'image/avif'};
    default:
      return null;
  }
  // We don't need these now, but they are easy to add
  // case 'mif1':
  //   return {extension: 'heic', mimeType: 'image/heif'};
  // case 'msf1':
  //   return {extension: 'heic', mimeType: 'image/heif-sequence'};
  // case 'heic':
  // case 'heix':
  //   return {extension: 'heic', mimeType: 'image/heic'};
  // case 'hevc':
  // case 'hevx':
  //   return {extension: 'heic', mimeType: 'image/heic-sequence'};
  // case 'qt':
  //   return {ext: 'mov', mime: 'video/quicktime'};
  // case 'M4V':
  // case 'M4VH':
  // case 'M4VP':
  //   return {ext: 'm4v', mime: 'video/x-m4v'};
  // case 'M4P':
  //   return {ext: 'm4p', mime: 'video/mp4'};
  // case 'M4B':
  //   return {ext: 'm4b', mime: 'audio/mp4'};
  // case 'M4A':
  //   return {ext: 'm4a', mime: 'audio/x-m4a'};
  // case 'F4V':
  //   return {ext: 'f4v', mime: 'video/mp4'};
  // case 'F4P':
  //   return {ext: 'f4p', mime: 'video/mp4'};
  // case 'F4A':
  //   return {ext: 'f4a', mime: 'audio/mp4'};
  // case 'F4B':
  //   return {ext: 'f4b', mime: 'audio/mp4'};
  // case 'crx':
  //   return {ext: 'cr3', mime: 'image/x-canon-cr3'};
  // default:
  // if (brandMajor.startsWith('3g')) {
  //   if (brandMajor.startsWith('3g2')) {
  //     return {ext: '3g2', mime: 'video/3gpp2'};
  //   }
  //   return {ext: '3gp', mime: 'video/3gpp'};
  // }
  // return {ext: 'mp4', mime: 'video/mp4'};
}

/** Interpret a chunk of bytes as a UTF8 string */
function getUTF8String(array: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...array.slice(start, end));
}

function stringToBytes(string: string): number[] {
  return [...string].map((character) => character.charCodeAt(0));
}

function checkString(buffer: ArrayLike<number>, header: string, offset: number = 0): boolean {
  const headerBytes = stringToBytes(header);

  for (let i = 0; i < headerBytes.length; ++i) {
    if (headerBytes[i] !== buffer[i + offset]) {
      return false;
    }
  }

  return true;
}
