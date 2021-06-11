import type {GeoTIFF, GeoTIFFImage} from 'geotiff';

import TiffPixelSource from '../tiff-pixel-source';
import {getOmeLegacyIndexer, getOmeSubIFDIndexer, OmeTiffIndexer} from './ome-indexers';
import {getOmePixelSourceMeta} from './ome-utils';
import {fromString} from './omexml';
import type {OmeTiffSelection} from './ome-indexers';

export const isOmeTiff = (img: GeoTIFFImage) => img.fileDirectory.ImageDescription.includes('<OME');

export async function loadOmeTiff(tiff: GeoTIFF, firstImage: GeoTIFFImage) {
  // Get first image from tiff and inspect OME-XML metadata
  const {
    ImageDescription,
    SubIFDs,
    PhotometricInterpretation: photometricInterpretation
  } = firstImage.fileDirectory;
  const omexml = fromString(ImageDescription);

  /*
   * Image pyramids are stored differently between versions of Bioformats.
   * Thus we need a different indexer depending on which format we have.
   */
  let levels: number;
  let pyramidIndexer: OmeTiffIndexer;

  if (SubIFDs) {
    // Image is >= Bioformats 6.0 and resolutions are stored using SubIFDs.
    levels = SubIFDs.length + 1;
    pyramidIndexer = getOmeSubIFDIndexer(tiff, omexml);
  } else {
    // Image is legacy format; resolutions are stored as separate images.
    levels = omexml.length;
    pyramidIndexer = getOmeLegacyIndexer(tiff, omexml);
  }

  // TODO: The OmeTIFF loader only works for the _first_ image in the metadata.
  const imgMeta = omexml[0];
  const {labels, getShape, physicalSizes, dtype} = getOmePixelSourceMeta(imgMeta);
  const tileSize = firstImage.getTileWidth();
  const meta = {photometricInterpretation, physicalSizes};

  const data = Array.from({length: levels}).map((_, resolution) => {
    const shape = getShape(resolution);
    const indexer = (sel: OmeTiffSelection) => pyramidIndexer(sel, resolution);
    const source = new TiffPixelSource(indexer, dtype, tileSize, shape, labels, meta);
    return source;
  });

  return {data, metadata: imgMeta};
}
