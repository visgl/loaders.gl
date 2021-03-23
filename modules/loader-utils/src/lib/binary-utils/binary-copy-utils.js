import {padToNBytes} from './memory-copy-utils';

export function copyPaddedArrayBufferToDataView(dataView, byteOffset, sourceBuffer, padding) {
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

export function copyPaddedStringToDataView(dataView, byteOffset, string, padding) {
  const textEncoder = new TextEncoder();
  // PERFORMANCE IDEA: We encode twice, once to get size and once to store
  // PERFORMANCE IDEA: Use TextEncoder.encodeInto() to avoid temporary copy
  const stringBuffer = textEncoder.encode(string);

  byteOffset = copyPaddedArrayBufferToDataView(dataView, byteOffset, stringBuffer, padding);

  return byteOffset;
}
