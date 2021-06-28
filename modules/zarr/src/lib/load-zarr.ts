import type {Store} from 'zarr/types/storage/types';
import {loadMultiscales, guessTileSize, guessLabels, normalizeStore, validLabels} from './utils';
import ZarrPixelSource from './zarr-pixel-source';

interface ZarrOptions {
  labels?: string[];
}

export async function loadZarr(root: string | Store, options: ZarrOptions = {}) {
  const store = normalizeStore(root);
  const {data, rootAttrs} = await loadMultiscales(store);
  const tileSize = guessTileSize(data[0]);

  // If no labels are provided, inspect the root attributes for the store.
  // For now, we only infer labels for OME-Zarr.
  const labels = options.labels ?? guessLabels(rootAttrs);

  if (!validLabels(labels, data[0].shape)) {
    throw new Error('Invalid labels for Zarr array dimensions.');
  }

  const pyramid = data.map((arr) => new ZarrPixelSource(arr, labels, tileSize));
  return {
    data: pyramid,
    metadata: rootAttrs
  };
}
