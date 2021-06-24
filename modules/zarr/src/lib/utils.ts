import {openGroup, HTTPStore} from 'zarr';
import type {ZarrArray} from 'zarr';
import type {Store} from 'zarr/types/storage/types';

import type {PixelSource, RootAttrs, Labels} from '../types';

export function normalizeStore(source: string | Store): Store {
  if (typeof source === 'string') {
    return new HTTPStore(source);
  }
  return source;
}

export async function loadMultiscales(store: Store, path = '') {
  const grp = await openGroup(store, path);
  const rootAttrs = (await grp.attrs.asObject()) as RootAttrs;

  // Root of Zarr store must implement multiscales extension.
  // https://github.com/zarr-developers/zarr-specs/issues/50
  if (!Array.isArray(rootAttrs.multiscales)) {
    throw new Error('Cannot find Zarr multiscales metadata.');
  }

  const {datasets} = rootAttrs.multiscales[0];
  const promises = datasets.map((d) => grp.getItem(d.path)) as Promise<ZarrArray>[];

  return {
    data: await Promise.all(promises),
    rootAttrs
  };
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

function prevPowerOf2(x: number) {
  return 2 ** Math.floor(Math.log2(x));
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

export function guessTileSize(arr: ZarrArray) {
  const interleaved = isInterleaved(arr.shape);
  const [yChunk, xChunk] = arr.chunks.slice(interleaved ? -3 : -2);
  const size = Math.min(yChunk, xChunk);
  // deck.gl requirement for power-of-two tile size.
  return prevPowerOf2(size);
}

export function guessLabels(rootAttrs: RootAttrs) {
  if ('omero' in rootAttrs) {
    return ['t', 'c', 'z', 'y', 'x'] as Labels<['t', 'c', 'z']>;
  }
  throw new Error(
    'Could not infer dimension labels for Zarr source. Must provide dimension labels.'
  );
}

/*
 * The 'indexer' for a Zarr-based source translates
 * a 'selection' to an array of indices that align to
 * the labeled dimensions.
 *
 * > const labels = ['a', 'b', 'y', 'x'];
 * > const indexer = getIndexer(labels);
 * > console.log(indexer({ a: 10, b: 20 }));
 * > // [10, 20, 0, 0]
 */
export function getIndexer<T extends string>(labels: T[]) {
  const size = labels.length;
  const dims = getDims(labels);
  return (sel: {[K in T]: number} | number[]) => {
    if (Array.isArray(sel)) {
      return [...sel];
    }
    const selection: number[] = Array(size).fill(0);
    for (const [key, value] of Object.entries(sel)) {
      selection[dims(key as T)] = value as number;
    }
    return selection;
  };
}

export function getImageSize<T extends string[]>(
  source: PixelSource<T>
): {height: number; width: number} {
  const interleaved = isInterleaved(source.shape);
  // 2D image data in Zarr are represented as (..., rows, columns [, bands])
  // If an image is interleaved (RGB/A), we need to ignore the last dimension (bands)
  // to get the height and weight of the image.
  const [height, width] = source.shape.slice(interleaved ? -3 : -2);
  return {height, width};
}

/**
 * Preserves (double) slashes earlier in the path, so this works better
 * for URLs. From https://stackoverflow.com/a/46427607
 * @param args parts of a path or URL to join.
 */
export function joinUrlParts(...args: string[]) {
  return args
    .map((part, i) => {
      if (i === 0) return part.trim().replace(/[/]*$/g, '');
      return part.trim().replace(/(^[/]*|[/]*$)/g, '');
    })
    .filter((x) => x.length)
    .join('/');
}

export function validLabels(labels: string[], shape: number[]): labels is Labels<string[]> {
  if (labels.length !== shape.length) {
    throw new Error('Labels do not match Zarr array shape.');
  }
  const n = shape.length;
  if (isInterleaved(shape)) {
    // last three dimensions are [row, column, bands]
    return labels[n - 3] === 'y' && labels[n - 2] === 'x' && labels[n - 1] === '_c';
  }
  // last two dimensions are [row, column]
  return labels[n - 2] === 'y' && labels[n - 1] === 'x';
}
