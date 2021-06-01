import quickselect from 'quickselect';
import type { TypedArray } from 'zarr';
import type { OMEXML } from './omexml';
import type { Labels, PixelSource } from '../types';

/**
 * Computes statics from pixel data.
 *
 * This is helpful for generating histograms
 * or scaling sliders to reasonable range. Also provided are
 * "autoSliders" which are slider bounds that should give a
 * good initial image.
 * @param {TypedArray} arr
 * @return {{ mean: number, sd: number, q1: number, q3: number, median: number, domain: number[], autoSliders: number[] }}
 */
export function getChannelStats(arr: TypedArray) {
  let len = arr.length;
  let min = Infinity;
  let max = -Infinity;
  let total = 0;
  // Range (min/max).
  // eslint-disable-next-line no-plusplus
  while (len--) {
    if (arr[len] < min) {
      min = arr[len];
    }
    if (arr[len] > max) {
      max = arr[len];
    }
    total += arr[len];
  }

  // Mean.
  const mean = total / arr.length;

  // Standard Deviation.
  len = arr.length;
  let sumSquared = 0;
  // eslint-disable-next-line no-plusplus
  while (len--) {
    sumSquared += (arr[len] - mean) ** 2;
  }
  const sd = (sumSquared / arr.length) ** 0.5;

  // Median, and quartiles via quickselect: https://en.wikipedia.org/wiki/Quickselect.
  // Odd number lengths should round down the index.
  const mid = Math.floor(arr.length / 2);
  const firstQuartileLocation = Math.floor(arr.length / 4);
  const thirdQuartileLocation = 3 * Math.floor(arr.length / 4);

  quickselect(arr, mid);
  const median = arr[mid];
  quickselect(arr, firstQuartileLocation, 0, mid);
  const q1 = arr[firstQuartileLocation];
  quickselect(arr, thirdQuartileLocation, mid, arr.length - 1);
  const q3 = arr[thirdQuartileLocation];

  // Used for "auto" settings.  This is the best parameter I've found experimentally.
  // I don't think there is a right answer and this feature is common in Fiji.
  // Also it's best to use a non-zero array for this.
  const cutoffArr = arr.filter((i: number) => i > 0);
  const cutoffPercentile = 0.0005;
  const topCutoffLocation = Math.floor(
    cutoffArr.length * (1 - cutoffPercentile)
  );
  const bottomCutoffLocation = Math.floor(cutoffArr.length * cutoffPercentile);
  quickselect(cutoffArr, topCutoffLocation);
  quickselect(cutoffArr, bottomCutoffLocation, 0, topCutoffLocation);
  const autoSliders = [
    cutoffArr[bottomCutoffLocation] || 0,
    cutoffArr[topCutoffLocation] || 0
  ];
  return {
    mean,
    sd,
    q1,
    q3,
    median,
    domain: [min, max],
    autoSliders
  };
}

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
type Sel<
  Dim extends string
> = Dim extends `${infer Z}${infer X}${infer A}${infer B}${infer C}`
  ? [C, B, A]
  : 'error';
export function getLabels(dimOrder: OMEXML[0]['Pixels']['DimensionOrder']) {
  return dimOrder.toLowerCase().split('').reverse() as Labels<
    Sel<Lowercase<typeof dimOrder>>
  >;
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
  return { height, width };
}

export const SIGNAL_ABORTED = '__vivSignalAborted';
