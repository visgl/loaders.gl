// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GeoTIFF as GeoTIFFDataset, GeoTIFFImage} from 'geotiff';
import {fromBlob, fromUrl} from 'geotiff';

import type {
  Source,
  DataSourceOptions,
  TypedArray,
  RasterSource,
  RasterSourceMetadata,
  GetRasterParameters,
  RasterData,
  RasterChannelDataType,
  RasterBoundingBox
} from '@loaders.gl/loader-utils';
import {DataSource, getRasterViewportBoundingBox} from '@loaders.gl/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Options for creating a GeoTIFF raster source.
 */
export type GeoTIFFSourceOptions = DataSourceOptions & {
  geotiff?: {
    /** Optional request headers forwarded to remote GeoTIFF fetches. */
    headers?: Record<string, string>;
    /** Default interleave mode for raster reads. */
    interleaved?: boolean;
    /** Default resampling mode for viewport reads. */
    resampleMethod?: 'nearest' | 'bilinear';
  };
};

/**
 * Source factory for viewport-driven GeoTIFF datasets.
 */
export const GeoTIFFSource = {
  name: 'GeoTIFFSource',
  id: 'geotiff',
  module: 'geotiff',
  version: VERSION,
  extensions: ['geotiff', 'tiff', 'geotif', 'tif'],
  mimeTypes: ['image/tiff', 'image/geotiff'],
  type: 'geotiff',
  fromUrl: true,
  fromBlob: true,

  defaultOptions: {
    geotiff: {
      headers: undefined!,
      interleaved: false,
      resampleMethod: 'nearest'
    }
  },

  testURL: (url: string): boolean => /\.(?:geotiff?|tiff?)(?:$|[?#])/i.test(url),
  createDataSource: (data: string | Blob, options: GeoTIFFSourceOptions): GeoTIFFRasterSource =>
    new GeoTIFFRasterSource(data, options)
} as const satisfies Source<GeoTIFFRasterSource>;

type GeoTIFFInit = {
  tiff: GeoTIFFDataset;
  images: GeoTIFFImage[];
  metadata: RasterSourceMetadata;
};

type GeoTIFFReadRasterResult = {width: number; height: number} & (
  | RasterData['data']
  | TypedArray[]
);

/**
 * Viewport-driven raster source backed by a GeoTIFF dataset.
 */
export class GeoTIFFRasterSource
  extends DataSource<string | Blob, GeoTIFFSourceOptions>
  implements RasterSource
{
  private _initPromise: Promise<GeoTIFFInit> | null = null;

  constructor(data: string | Blob, options: GeoTIFFSourceOptions) {
    super(data, options, GeoTIFFSource.defaultOptions);
  }

  async getMetadata(): Promise<RasterSourceMetadata> {
    const {metadata} = await this._getInitPromise();
    return metadata;
  }

  async getRaster(parameters: GetRasterParameters): Promise<RasterData> {
    const {tiff, metadata} = await this._getInitPromise();
    const viewportBoundingBox = getRasterViewportBoundingBox(parameters.viewport);
    const viewportCrs = parameters.viewport.crs;

    if (metadata.crs && viewportCrs && metadata.crs !== viewportCrs) {
      throw new Error(
        `GeoTIFFRasterSource does not support reprojection. Requested ${viewportCrs}, source ${metadata.crs}.`
      );
    }

    if (!metadata.boundingBox) {
      throw new Error('GeoTIFFRasterSource requires source bounds to fulfill viewport requests.');
    }

    const interleaved = parameters.interleaved ?? this.options.geotiff?.interleaved ?? false;
    const raster = (await tiff.readRasters({
      bbox: flattenBoundingBox(viewportBoundingBox),
      width: parameters.viewport.width,
      height: parameters.viewport.height,
      samples: parameters.bands,
      interleave: interleaved,
      signal: parameters.signal,
      resampleMethod: parameters.resampleMethod ?? this.options.geotiff?.resampleMethod
    })) as unknown as GeoTIFFReadRasterResult;

    const data = normalizeRasterReadResult(raster, interleaved);
    const bandCount = parameters.bands?.length ?? metadata.bandCount;

    return {
      data,
      width: raster.width,
      height: raster.height,
      bandCount,
      dtype: metadata.dtype,
      interleaved,
      noData: metadata.noData,
      boundingBox: viewportBoundingBox,
      crs: metadata.crs,
      metadata: metadata.metadata
    };
  }

  private async _initialize(): Promise<GeoTIFFInit> {
    const tiff = await this._openGeoTIFF();
    const imageCount = await tiff.getImageCount();
    const images = await Promise.all(
      Array.from({length: imageCount}, (_, index) => tiff.getImage(index))
    );

    if (!images.length) {
      throw new Error('GeoTIFFRasterSource could not load any images.');
    }

    const referenceImage = images[0];
    const metadata = this._getMetadata(referenceImage, images);

    return {tiff, images, metadata};
  }

  private _getInitPromise(): Promise<GeoTIFFInit> {
    if (!this._initPromise) {
      this._initPromise = this._initialize();
    }

    return this._initPromise;
  }

  private async _openGeoTIFF(): Promise<GeoTIFFDataset> {
    if (typeof this.data === 'string') {
      return await fromUrl(this.url, this.options.geotiff?.headers);
    }

    return await fromBlob(this.data);
  }

  private _getMetadata(referenceImage: GeoTIFFImage, images: GeoTIFFImage[]): RasterSourceMetadata {
    const boundingBox = getImageBoundingBox(referenceImage);
    const geoKeys = referenceImage.getGeoKeys?.() || undefined;
    const gdalMetadata = referenceImage.getGDALMetadata?.() || undefined;
    const noData = referenceImage.getGDALNoData?.() ?? null;

    return {
      name: getGeoTIFFName(this.data),
      keywords: [],
      attributions: this.options.core?.attributions || [],
      crs: getImageCRS(referenceImage),
      boundingBox,
      width: referenceImage.getWidth(),
      height: referenceImage.getHeight(),
      bandCount: referenceImage.getSamplesPerPixel(),
      dtype: getImageDataType(referenceImage),
      tileSize: {
        width: referenceImage.getTileWidth(),
        height: referenceImage.getTileHeight()
      },
      overviews: images.map((image, index) => ({
        index,
        width: image.getWidth(),
        height: image.getHeight(),
        resolution: getImageResolution(image, referenceImage)
      })),
      noData,
      metadata: {
        geoKeys,
        gdalMetadata
      }
    };
  }
}

function flattenBoundingBox(boundingBox: RasterBoundingBox): [number, number, number, number] {
  return [...boundingBox[0], ...boundingBox[1]];
}

function normalizeRasterReadResult(
  raster: GeoTIFFReadRasterResult,
  interleaved: boolean
): RasterData['data'] {
  if (interleaved) {
    return raster as unknown as RasterData['data'];
  }

  if (Array.isArray(raster)) {
    return raster.length === 1 ? raster[0] : raster;
  }

  return [raster as unknown as TypedArray];
}

function getGeoTIFFName(data: string | Blob): string | undefined {
  if (typeof data !== 'string') {
    return undefined;
  }

  const [path] = data.split(/[?#]/);
  return path.split('/').pop() || undefined;
}

function getImageBoundingBox(image: GeoTIFFImage): RasterBoundingBox | undefined {
  try {
    const [minX, minY, maxX, maxY] = image.getBoundingBox();
    return [
      [minX, minY],
      [maxX, maxY]
    ];
  } catch {
    return undefined;
  }
}

function getImageResolution(
  image: GeoTIFFImage,
  referenceImage: GeoTIFFImage
): [number, number] | undefined {
  try {
    const resolution = image.getResolution(referenceImage);
    return [resolution[0], resolution[1]];
  } catch {
    return undefined;
  }
}

function getImageCRS(image: GeoTIFFImage): string | undefined {
  const geoKeys = image.getGeoKeys?.();
  const projectedCrs = geoKeys?.ProjectedCSTypeGeoKey;
  if (projectedCrs) {
    return `EPSG:${projectedCrs}`;
  }

  const geographicCrs = geoKeys?.GeographicTypeGeoKey;
  if (geographicCrs) {
    return `EPSG:${geographicCrs}`;
  }

  return undefined;
}

function getImageDataType(image: GeoTIFFImage): RasterChannelDataType {
  const bitsPerSample = normalizeSampleValue(image.getBitsPerSample());
  const sampleFormat = normalizeSampleValue(image.getSampleFormat());

  switch (sampleFormat) {
    case 1:
      switch (bitsPerSample) {
        case 8:
          return 'uint8';
        case 16:
          return 'uint16';
        case 32:
          return 'uint32';
        default:
          break;
      }
      break;

    case 2:
      switch (bitsPerSample) {
        case 8:
          return 'int8';
        case 16:
          return 'int16';
        case 32:
          return 'int32';
        default:
          break;
      }
      break;

    case 3:
      switch (bitsPerSample) {
        case 32:
          return 'float32';
        case 64:
          return 'float64';
        default:
          break;
      }
      break;

    default:
      break;
  }

  throw new Error(
    `GeoTIFFRasterSource does not support sample format ${sampleFormat} with ${bitsPerSample} bits.`
  );
}

function normalizeSampleValue(value: number | number[]): number {
  return Array.isArray(value) ? value[0] : value;
}
