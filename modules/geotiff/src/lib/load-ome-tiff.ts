import type {GeoTIFF} from 'geotiff';
import {fromString} from './ome/omexml';

import TiffPixelSource from './tiff-pixel-source';
import {getOmeLegacyIndexer, getOmeSubIFDIndexer, OmeTiffIndexer} from './ome/ome-indexers';
import {getOmePixelSourceMeta} from './ome/ome-utils';

export interface OmeTiffSelection {
  t: number;
  c: number;
  z: number;
}

export async function loadOMETiff(tiff: GeoTIFF) {
  // Get first image from tiff and inspect OME-XML metadata
  const firstImage = await tiff.getImage(0);
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
  let levels;
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

  return {
    data,
    metadata: imgMeta
  };
}
