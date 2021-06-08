import type {PixelSource} from '../../types';

export function ensureArray<T>(x: T | T[]) {
  return Array.isArray(x) ? x : [x];
}

/*
 * Converts 32-bit integer color representation to RGBA tuple.
 * Used to serialize colors from OME-XML metadata.
 *
 * > console.log(intToRgba(100100));
 * > // [0, 1, 135, 4]
 */
export function intToRgba(int: number) {
  if (!Number.isInteger(int)) {
    throw Error('Not an integer.');
  }

  // Write number to int32 representation (4 bytes).
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setInt32(0, int, false); // offset === 0, littleEndian === false

  // Take u8 view and extract number for each byte (1 byte for R/G/B/A).
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes) as [number, number, number, number];
}

/*
 * Helper method to determine whether pixel data is interleaved or not.
 * > isInterleaved([1, 24, 24]) === false;
 * > isInterleaved([1, 24, 24, 3]) === true;
 */
export function isInterleaved(shape: number[]) {
  const lastDimSize = shape[shape.length - 1];
  return lastDimSize === 3 || lastDimSize === 4;
}

export function getImageSize<T extends string[]>(source: PixelSource<T>) {
  const interleaved = isInterleaved(source.shape);
  const [height, width] = source.shape.slice(interleaved ? -3 : -2);
  return {height, width};
}

export const SIGNAL_ABORTED = '__vivSignalAborted';
