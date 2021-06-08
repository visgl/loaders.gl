import type {OMEXML} from './omexml';
import type {Labels, PixelSource} from '../../types';

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

/*
 * Creates typed labels from DimensionOrder.
 * > imgMeta.Pixels.DimensionOrder === 'XYCZT'
 * > getLabels(imgMeta.Pixels) === ['t', 'z', 'c', 'y', 'x']
 */
type Sel<Dim extends string> = Dim extends `${infer Z}${infer X}${infer A}${infer B}${infer C}`
  ? [C, B, A]
  : 'error';
export function getLabels(dimOrder: OMEXML[0]['Pixels']['DimensionOrder']) {
  return dimOrder.toLowerCase().split('').reverse() as Labels<Sel<Lowercase<typeof dimOrder>>>;
}

/*
 * Creates an ES6 map of 'label' -> index
 * > const labels = ['a', 'b', 'c', 'd'];
 * > const dims = getDims(labels);
 * > dims('a') === 0;
 * > dims('b') === 1;
 * > dims('c') === 2;
 * > dims('hi!'); // throws
 */
export function getDims<S extends string>(labels: S[]) {
  const lookup = new Map(labels.map((name, i) => [name, i]));
  if (lookup.size !== labels.length) {
    throw Error('Labels must be unique, found duplicated label.');
  }
  return (name: S) => {
    const index = lookup.get(name);
    if (index === undefined) {
      throw Error('Invalid dimension.');
    }
    return index;
  };
}

export function getImageSize<T extends string[]>(source: PixelSource<T>) {
  const interleaved = isInterleaved(source.shape);
  const [height, width] = source.shape.slice(interleaved ? -3 : -2);
  return {height, width};
}

export const SIGNAL_ABORTED = '__vivSignalAborted';
