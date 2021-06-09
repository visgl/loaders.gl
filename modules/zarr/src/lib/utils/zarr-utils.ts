import {openGroup} from 'zarr';
import type {ZarrArray} from 'zarr';
import type {OMEXML} from './omexml';
import {getLabels, isInterleaved} from './utils';

// TODO "Circular dependency"
import type {RootAttrs} from '../load-zarr';

/*
 * Returns true if data shape is that expected for OME-Zarr.
 */
function isOmeZarr(dataShape: number[], Pixels: OMEXML[0]['Pixels']) {
  const {SizeT, SizeC, SizeZ, SizeY, SizeX} = Pixels;
  // OME-Zarr dim order is always ['t', 'c', 'z', 'y', 'x']
  const omeZarrShape = [SizeT, SizeC, SizeZ, SizeY, SizeX];
  return dataShape.every((size, i) => omeZarrShape[i] === size);
}

/*
 * Specifying different dimension orders form the METADATA.ome.xml is
 * possible and necessary for creating an OME-Zarr precursor.
 *
 * e.g. `bioformats2raw --file_type=zarr --dimension-order='XYZCT'`
 *
 * This is fragile code, and will only be executed if someone
 * tries to specify different dimension orders.
 */
export function guessBioformatsLabels({shape}: ZarrArray, {Pixels}: OMEXML[0]) {
  if (isOmeZarr(shape, Pixels)) {
    // It's an OME-Zarr Image,
    return getLabels('XYZCT');
  }

  // Guess labels derived from OME-XML
  const labels = getLabels(Pixels.DimensionOrder);
  labels.forEach((lower, i) => {
    const label = lower.toUpperCase();
    const xmlSize = (Pixels as any)[`Size${label}`] as number;
    if (!xmlSize) {
      throw Error(`Dimension ${label} is invalid for OME-XML.`);
    }
    if (shape[i] !== xmlSize) {
      throw Error('Dimension mismatch between zarr source and OME-XML.');
    }
  });

  return labels;
}

/*
 * Looks for the first file with root path and returns the full path prefix.
 *
 * > const files = [
 * >  { path: '/some/long/path/to/data.zarr/.zattrs' },
 * >  { path: '/some/long/path/to/data.zarr/.zgroup' },
 * >  { path: '/some/long/path/to/data.zarr/0/.zarray' },
 * >  { path: '/some/long/path/to/data.zarr/0/0.0' },
 * > ];
 * > getRootPrefix(files, 'data.zarr') === '/some/long/path/to/data.zarr'
 */
export function getRootPrefix(files: {path: string}[], rootName: string) {
  const first = files.find((f) => f.path.indexOf(rootName) > 0);
  if (!first) {
    throw Error('Could not find root in store.');
  }
  const prefixLength = first.path.indexOf(rootName) + rootName.length;
  return first.path.slice(0, prefixLength);
}

export async function loadMultiscales(store: ZarrArray['store'], path = '') {
  const grp = await openGroup(store, path);
  const rootAttrs = (await grp.attrs.asObject()) as RootAttrs;

  let paths = ['0'];
  if ('multiscales' in rootAttrs) {
    const {datasets} = rootAttrs.multiscales[0];
    paths = datasets.map((d) => d.path);
  }

  const data = paths.map((path) => grp.getItem(path));
  return {
    data: (await Promise.all(data)) as ZarrArray[],
    rootAttrs
  };
}

function prevPowerOf2(x: number) {
  return 2 ** Math.floor(Math.log2(x));
}

export function guessTileSize(arr: ZarrArray) {
  const interleaved = isInterleaved(arr.shape);
  const [yChunk, xChunk] = arr.chunks.slice(interleaved ? -3 : -2);
  const size = Math.min(yChunk, xChunk);
  // deck.gl requirement for power-of-two tile size.
  return prevPowerOf2(size);
}
