import { openGroup } from 'zarr';
import { FetchFileStore } from './storage';
import type { ZarrArray } from 'zarr';
import type { PixelSource } from '../types';


export function normalizeStore(source: string | ZarrArray['store']): ZarrArray['store'] {
  if (typeof source === 'string') {
    return new FetchFileStore(source);
  }
  return source;
}

export interface Multiscale {
  datasets: { path: string }[];
  version?: string;
}

export async function loadMultiscales<RootAttrs extends { multiscales: Multiscale[] }>(store: string | ZarrArray['store'], path = '') {
  store = normalizeStore(store);
  const grp = await openGroup(store, path);
  const rootAttrs = (await grp.attrs.asObject()) as RootAttrs;

  let paths = ['0'];
  if ('multiscales' in rootAttrs) {
    const { datasets } = rootAttrs.multiscales[0];
    paths = datasets.map(d => d.path);
  }

  const data = paths.map(path => grp.getItem(path));
  return {
    data: (await Promise.all(data)) as ZarrArray[],
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
  return (sel: { [K in T]: number } | number[]) => {
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

export function getImageSize<T extends string[]>(source: PixelSource<T>): { height: number, width: number } {
  const interleaved = isInterleaved(source.shape);
  // 2D image data in Zarr are represented as (..., rows, columns [, bands])
  // If an image is interleaved (RGB/A), we need to ignore the last dimension (bands) 
  // to get the height and weight of the image.
  const [height, width] = source.shape.slice(interleaved ? -3 : -2);
  return { height, width };
}
