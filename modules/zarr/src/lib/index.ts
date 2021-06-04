import type { ZarrArray } from 'zarr';

import { loadMultiscales, guessTileSize } from './utils';
import { FetchFileStore } from './storage';
import ZarrPixelSource from './pixel-source';
import type { Labels } from '../types';

/**
 * Initializes multiscale Zarr pixel source.
 * @param source Root url to multiscale Zarr store, or Zarr store.
 * @param labels Labels for each array dimension.
 */
export async function load<S extends string[]>(source: string | ZarrArray['store'], labels: Labels<S>) {
  if (typeof source === 'string') {
    source = new FetchFileStore(source);
  }
  const { data } = await loadMultiscales(source);
  const tileSize = guessTileSize(data[0]);
  return data.map(arr => new ZarrPixelSource(arr, labels, tileSize));
}