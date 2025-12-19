// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Get the first characters from a binary file (interpret the first bytes as an ASCII string)
 * @param data
 * @param length
 * @returns
 */
export function getFirstCharacters(data: string | ArrayBuffer, length: number = 5): string {
  if (typeof data === 'string') {
    return data.slice(0, length);
  } else if (ArrayBuffer.isView(data)) {
    // Typed Arrays can have offsets into underlying buffer
    return getMagicString(data.buffer, data.byteOffset, length);
  } else if (data instanceof ArrayBuffer) {
    const byteOffset = 0;
    return getMagicString(data, byteOffset, length);
  }
  return '';
}

/**
 * Gets a magic string from a "file"
 * Typically used to check or detect file format
 * @param arrayBuffer
 * @param byteOffset
 * @param length
 * @returns
 */
export function getMagicString(
  arrayBuffer: ArrayBuffer,
  byteOffset: number,
  length: number
): string {
  if (arrayBuffer.byteLength <= byteOffset + length) {
    return '';
  }
  const dataView = new DataView(arrayBuffer);
  let magic = '';
  for (let i = 0; i < length; i++) {
    magic += String.fromCharCode(dataView.getUint8(byteOffset + i));
  }
  return magic;
}
