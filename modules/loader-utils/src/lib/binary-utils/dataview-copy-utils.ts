// loaders./gl, MIT license

import {TypedArray} from '../../types';
import {padToNBytes} from './memory-copy-utils';

/**
 * Helper function that pads a string with spaces to fit a certain byte alignment
 * @param string
 * @param byteAlignment
 * @returns
 *
 * @todo PERFORMANCE IDEA: No need to copy string twice...
 */
export function padStringToByteAlignment(string: string, byteAlignment: number): string {
  const length = string.length;
  const paddedLength = Math.ceil(length / byteAlignment) * byteAlignment; // Round up to the required alignment
  const padding = paddedLength - length;
  let whitespace = '';
  for (let i = 0; i < padding; ++i) {
    whitespace += ' ';
  }
  return string + whitespace;
}

/**
 *
 * @param dataView
 * @param byteOffset
 * @param string
 * @param byteLength
 * @returns
 */
export function copyStringToDataView(
  dataView: DataView,
  byteOffset: number,
  string: string,
  byteLength: number
): number {
  if (dataView) {
    for (let i = 0; i < byteLength; i++) {
      dataView.setUint8(byteOffset + i, string.charCodeAt(i));
    }
  }
  return byteOffset + byteLength;
}

export function copyBinaryToDataView(dataView, byteOffset, binary, byteLength) {
  if (dataView) {
    for (let i = 0; i < byteLength; i++) {
      dataView.setUint8(byteOffset + i, binary[i]);
    }
  }
  return byteOffset + byteLength;
}

/**
 * Copy sourceBuffer to dataView with some padding
 *
 * @param dataView - destination data container. If null - only new offset is calculated
 * @param byteOffset - destination byte offset to copy to
 * @param sourceBuffer - source data buffer
 * @param padding - pad the resulting array to multiple of "padding" bytes. Additional bytes are filled with 0x20 (ASCII space)
 *
 * @return new byteOffset of resulting dataView
 */
export function copyPaddedArrayBufferToDataView(
  dataView: DataView | null,
  byteOffset: number,
  sourceBuffer: TypedArray,
  padding: number
): number {
  const paddedLength = padToNBytes(sourceBuffer.byteLength, padding);
  const padLength = paddedLength - sourceBuffer.byteLength;

  if (dataView) {
    // Copy array
    const targetArray = new Uint8Array(
      dataView.buffer,
      dataView.byteOffset + byteOffset,
      sourceBuffer.byteLength
    );
    const sourceArray = new Uint8Array(sourceBuffer);
    targetArray.set(sourceArray);

    // Add PADDING
    for (let i = 0; i < padLength; ++i) {
      // json chunk is padded with spaces (ASCII 0x20)
      dataView.setUint8(byteOffset + sourceBuffer.byteLength + i, 0x20);
    }
  }
  byteOffset += paddedLength;
  return byteOffset;
}

/**
 * Copy string to dataView with some padding
 *
 * @param {DataView | null} dataView - destination data container. If null - only new offset is calculated
 * @param {number} byteOffset - destination byte offset to copy to
 * @param {string} string - source string
 * @param {number} padding - pad the resulting array to multiple of "padding" bytes. Additional bytes are filled with 0x20 (ASCII space)
 *
 * @return new byteOffset of resulting dataView
 */
export function copyPaddedStringToDataView(
  dataView: DataView | null,
  byteOffset: number,
  string: string,
  padding: number
): number {
  const textEncoder = new TextEncoder();
  // PERFORMANCE IDEA: We encode twice, once to get size and once to store
  // PERFORMANCE IDEA: Use TextEncoder.encodeInto() to avoid temporary copy
  const stringBuffer = textEncoder.encode(string);

  byteOffset = copyPaddedArrayBufferToDataView(dataView, byteOffset, stringBuffer, padding);

  return byteOffset;
}
