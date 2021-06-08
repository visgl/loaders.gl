import {HTTPStore} from 'zarr';
import {FileStore} from './utils/storage';
import {getRootPrefix} from './utils/zarr-utils';

import {loadBioformatsZarrHelper} from './load-bioformats-zarr-helper';
import {loadZarr} from './load-zarr';

interface ZarrOptions {
  fetchOptions: RequestInit;
}

/**
 * Opens root directory generated via `bioformats2raw --file_type=zarr`. Uses OME-XML metadata,
 * and assumes first image. This function is the zarr-equivalent to using loadOmeTiff.
 *
 * @param {string} source url
 * @param {{ fetchOptions: (undefined | RequestInit) }} options
 * @return {Promise<{ data: ZarrPixelSource[], metadata: ImageMeta }>} data source and associated OMEXML metadata.
 */
export async function loadBioformatsZarr(
  source: string | (File & {path: string})[],
  options: Partial<ZarrOptions> = {}
) {
  const METADATA = 'METADATA.ome.xml';
  const ZARR_DIR = 'data.zarr';

  if (typeof source === 'string') {
    const url = source.endsWith('/') ? source.slice(0, -1) : source;
    const store = new HTTPStore(`${url}/${ZARR_DIR}`, options);
    const xmlSource = await fetch(`${url}/${METADATA}`, options.fetchOptions);
    return loadBioformatsZarrHelper(store, xmlSource);
  }

  /*
   * You can't randomly access files from a directory by path name
   * without the Native File System API, so we need to get objects for _all_
   * the files right away for Zarr. This is unfortunate because we need to iterate
   * over all File objects and create an in-memory index.
   *
   * fMap is simple key-value mapping from 'some/file/path' -> File
   */
  const fMap: Map<string, File> = new Map();

  let xmlFile: File | undefined;
  for (const file of source) {
    if (file.name === METADATA) {
      xmlFile = file;
    } else {
      fMap.set(file.path, file);
    }
  }

  if (!xmlFile) {
    throw Error('No OME-XML metadata found for store.');
  }

  const store = new FileStore(fMap, getRootPrefix(source, ZARR_DIR));
  return loadBioformatsZarrHelper(store, xmlFile);
}

/**
 * Opens root of multiscale OME-Zarr via URL.
 *
 * @param {string} source url
 * @param {{ fetchOptions: (undefined | RequestInit) }} options
 * @return {Promise<{ data: ZarrPixelSource[], metadata: RootAttrs }>} data source and associated OME-Zarr metadata.
 */
export async function loadOmeZarr(
  source: string,
  options: Partial<ZarrOptions & {type: 'multiscales'}> = {}
) {
  const store = new HTTPStore(source, options);

  if (options?.type !== 'multiscales') {
    throw Error('Only multiscale OME-Zarr is supported.');
  }

  return loadZarr(store);
}
