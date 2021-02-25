import {TypedArray} from '../../types';

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
  sourceBuffer: Array<number> | TypedArray,
  padding: number
);
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
);
