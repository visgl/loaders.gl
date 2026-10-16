// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions, TypedArray} from '@loaders.gl/loader-utils';
import type {CRSIdentifier} from '@math.gl/crs';

/** One original sample band, with no color conversion, resampling or scale/offset applied. */
export type GeoTIFFRasterBand = {
  /** Zero-based sample index in the original image. */
  index: number;
  /** Raw samples in TIFF row-major order, one value per pixel. */
  data: TypedArray;
  /** GDAL metadata for this band, including DESCRIPTION, UNITTYPE, SCALE and OFFSET. */
  metadata: Record<string, unknown> | null;
};

/** One TIFF image directory, retaining its geometry and identity independently of other images. */
export type GeoTIFFRasterImage = {
  /** Zero-based image directory index in the file. */
  index: number;
  /** Original image width in pixels. */
  width: number;
  /** Original image height in pixels. */
  height: number;
  /** Selected bands in original sample order. */
  bands: GeoTIFFRasterBand[];
  /** Decoded GeoKeys, including pixel registration and CRS definitions. */
  geoKeys: Record<string, unknown> | null;
  /** Image-level GDAL metadata, separate from per-band metadata. */
  metadata: Record<string, unknown> | null;
  /** Declared GDAL nodata value, before band scale/offset. Null when absent. */
  noData: number | null;
  /** Decoded TIFF tags, including tiepoints, pixel scale, transformation and NewSubfileType. */
  fileDirectory: Record<string, unknown>;
  /** EPSG CRS when directly identified by a geographic or projected GeoKey. */
  crs?: CRSIdentifier;
};

/** Structured-cloneable numeric TIFF dataset. No decoder objects or methods are returned. */
export type GeoTIFFRasterData = {
  /** Selected images in original file order; overviews and subgrids remain distinct. */
  images: GeoTIFFRasterImage[];
};

/** Options for complete-image numeric TIFF decoding. */
export type GeoTIFFRasterLoaderOptions = LoaderOptions & {
  /** Numeric raster selection. Samples and dimensions are never resampled. */
  geotiff?: {
    /** Original core when supported, with geotiff.js fallback; native forbids fallback. Defaults to auto. */
    decoder?: 'auto' | 'native' | 'geotiff';
    /** Maximum output pixels per selected image; defaults to 16 million. */
    maxPixels?: number;
    /** Maximum output bytes per selected image; defaults to 256 MiB. */
    maxDecodedBytes?: number;
    /** Caller cancellation for metadata discovery and sample decoding. */
    signal?: AbortSignal;
    /** Checked TIFF directory graph budgets, applied to every backend. */
    directoryLimits?: {
      /** Maximum main-chain and SubIFD directories; defaults to 1024. */
      maxDirectories?: number;
      /** Maximum tags per directory; defaults to 4096. */
      maxEntriesPerDirectory?: number;
      /** Cumulative directory and tag-value byte budget; defaults to 16 MiB. */
      maxMetadataBytes?: number;
    };
    /** Zero-based image indices to decode. Defaults to every image in the IFD chain. */
    imageIndices?: readonly number[];
    /** Zero-based bands to decode in every selected image. Defaults to every band. */
    bands?: readonly number[];
  };
};
