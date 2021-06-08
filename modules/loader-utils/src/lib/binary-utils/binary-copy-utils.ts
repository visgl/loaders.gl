import {TypedArray} from '../../types';
import {padToNBytes} from './memory-copy-utils';

/**
 * Copy sourceBuffer to dataView with some padding
 *
 * @param {DataView | null} dataView - destination data container. If null - only new offset is calculated
 * @param {number} byteOffset - destination byte offset to copy to
 * @param {Array | TypedArray} sourceBuffer - source data buffer
 * @param {number} padding - pad the resulting array to multiple of "padding" bytes. Additional bytes are filled with 0x20 (ASCII space)
 *
 * @return new byteOffset of resulting dataView
 */
export function copyPaddedArrayBufferToDataView(
  dataView: DataView | null,
  byteOffset: number,
  sourceBuffer: TypedArray,
  padding: number
) {
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
