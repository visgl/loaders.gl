import type { ZarrArray } from 'zarr';
import { loadMultiscales, guessTileSize, Multiscale } from './utils';
import ZarrPixelSource from './zarr-pixel-source';
import type { Labels } from '../types';

/**
 * Initializes multiscale Zarr pixel source.
 * @param source Root url to multiscale Zarr store, or Zarr store.
 * @param labels Labels for each array dimension.
 */
export async function loadZarr<S extends string[], RootAttrs extends { multiscales: Multiscale[] }>(source: string | ZarrArray['store'], labels: Labels<S>) {
  const { data, rootAttrs } = await loadMultiscales<RootAttrs>(source);
  const tileSize = guessTileSize(data[0]);
  const pyramid = data.map(arr => new ZarrPixelSource(arr, labels, tileSize));
  return {
    data: pyramid,
    metadata: rootAttrs,
  }
}
