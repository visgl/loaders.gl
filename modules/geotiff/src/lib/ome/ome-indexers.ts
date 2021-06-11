import type {GeoTIFFImage, GeoTIFF, ImageFileDirectory} from 'geotiff';
import type {OMEXML} from '../ome/omexml';

export type OmeTiffSelection = {t: number; c: number; z: number};
export type OmeTiffIndexer = (sel: OmeTiffSelection, z: number) => Promise<GeoTIFFImage>;

/*
 * An "indexer" for a GeoTIFF-based source is a function that takes a
 * "selection" (e.g. { z, t, c }) and returns a Promise for the GeoTIFFImage
 * object corresponding to that selection.
 *
 * For OME-TIFF images, the "selection" object is the same regardless of
 * the format version. However, modern version of Bioformats have a different
 * memory layout for pyramidal resolutions. Thus, we have two different "indexers"
 * depending on which format version is detected.
 *
 * TODO: We currently only support indexing the first image in the OME-TIFF with
 * our indexers. There can be multiple images in an OME-TIFF, so supporting these
 * images will require extending these indexers or creating new methods.
 */

/*
 * Returns an indexer for legacy Bioformats images. This assumes that
 * downsampled resolutions are stored sequentially in the OME-TIFF.
 */
export function getOmeLegacyIndexer(tiff: GeoTIFF, rootMeta: OMEXML): OmeTiffIndexer {
  const imgMeta = rootMeta[0];
  const {SizeT, SizeC, SizeZ} = imgMeta.Pixels;
  const ifdIndexer = getOmeIFDIndexer(imgMeta);

  return (sel: OmeTiffSelection, pyramidLevel: number) => {
    // Get IFD index at base pyramid level
    const index = ifdIndexer(sel);
    // Get index of first image at pyramidal level
    const pyramidIndex = pyramidLevel * SizeZ * SizeT * SizeC;
    // Return image at IFD index for pyramidal level
    return tiff.getImage(index + pyramidIndex);
  };
}

/*
 * Returns an indexer for modern Bioforamts images that store multiscale
 * resolutions using SubIFDs.
 *
 * The ifdIndexer returns the 'index' to the base resolution for a
 * particular 'selection'. The SubIFDs to the downsampled resolutions
 * of the 'selection' are stored within the `baseImage.fileDirectory`.
 * We use the SubIFDs to get the IFD for the corresponding sub-resolution.
 *
 * NOTE: This function create a custom IFD cache rather than mutating
 * `GeoTIFF.ifdRequests` with a random offset. The IFDs are cached in
 * an ES6 Map that maps a string key that identifies the selection uniquely
 * to the corresponding IFD.
 */
export function getOmeSubIFDIndexer(tiff: GeoTIFF, rootMeta: OMEXML): OmeTiffIndexer {
  const imgMeta = rootMeta[0];
  const ifdIndexer = getOmeIFDIndexer(imgMeta);
  const ifdCache: Map<string, Promise<ImageFileDirectory>> = new Map();

  return async (sel: OmeTiffSelection, pyramidLevel: number) => {
    const index = ifdIndexer(sel);
    const baseImage = await tiff.getImage(index);

    // It's the highest resolution, no need to look up SubIFDs.
    if (pyramidLevel === 0) {
      return baseImage;
    }

    const {SubIFDs} = baseImage.fileDirectory;
    if (!SubIFDs) {
      throw Error('Indexing Error: OME-TIFF is missing SubIFDs.');
    }

    // Get IFD for the selection at the pyramidal level
    const key = `${sel.t}-${sel.c}-${sel.z}-${pyramidLevel}`;
    if (!ifdCache.has(key)) {
      // Only create a new request if we don't have the key.
      const subIfdOffset = SubIFDs[pyramidLevel - 1];
      ifdCache.set(key, tiff.parseFileDirectoryAt(subIfdOffset));
    }
    const ifd = (await ifdCache.get(key)) as ImageFileDirectory;

    // Create a new image object manually from IFD
    // https://github.com/geotiffjs/geotiff.js/blob/8ef472f41b51d18074aece2300b6a8ad91a21ae1/src/geotiff.js#L447-L453
    return new (baseImage.constructor as any)(
      ifd.fileDirectory,
      ifd.geoKeyDirectory,
      tiff.dataView,
      tiff.littleEndian,
      tiff.cache,
      tiff.source
    ) as GeoTIFFImage;
  };
}

/*
 * Returns a function that computes the image index based on the dimension
 * order and dimension sizes.
 */
function getOmeIFDIndexer(imgMeta: OMEXML[0]): (sel: OmeTiffSelection) => number {
  const {SizeC, SizeZ, SizeT, DimensionOrder} = imgMeta.Pixels;
  switch (DimensionOrder) {
    case 'XYZCT': {
      return ({t, c, z}) => t * SizeZ * SizeC + c * SizeZ + z;
    }
    case 'XYZTC': {
      return ({t, c, z}) => c * SizeZ * SizeT + t * SizeZ + z;
    }
    case 'XYCTZ': {
      return ({t, c, z}) => z * SizeC * SizeT + t * SizeC + c;
    }
    case 'XYCZT': {
      return ({t, c, z}) => t * SizeC * SizeZ + z * SizeC + c;
    }
    case 'XYTCZ': {
      return ({t, c, z}) => z * SizeT * SizeC + c * SizeT + t;
    }
    case 'XYTZC': {
      return ({t, c, z}) => c * SizeT * SizeZ + z * SizeT + t;
    }
    default: {
      throw new Error(`Invalid OME-XML DimensionOrder, got ${DimensionOrder}.`);
    }
  }
}
