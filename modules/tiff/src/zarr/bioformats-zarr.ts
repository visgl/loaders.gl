import type { ZarrArray } from 'zarr';

import { fromString } from '../omexml';
import {
  guessBioformatsLabels,
  loadMultiscales,
  guessTileSize
} from './lib/utils';
import ZarrPixelSource from './pixel-source';

export async function load(
  root: ZarrArray['store'],
  xmlSource: string | File | Response
) {
  // If 'File' or 'Response', read as text.
  if (typeof xmlSource !== 'string') {
    xmlSource = await xmlSource.text();
  }

  // Get metadata and multiscale data for _first_ image.
  const imgMeta = fromString(xmlSource)[0];
  const { data } = await loadMultiscales(root, '0');

  const labels = guessBioformatsLabels(data[0], imgMeta);
  const tileSize = guessTileSize(data[0]);
  const pyramid = data.map(arr => new ZarrPixelSource(arr, labels, tileSize));

  return {
    data: pyramid,
    metadata: imgMeta
  };
}
