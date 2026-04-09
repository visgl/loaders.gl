// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  DataSourceOptions,
  GetImageParameters,
  GetTileDataParameters,
  GetTileParameters,
  ImageSourceMetadata,
  ImageTileSource,
  ImageType,
  Source,
  TileRangeRequestSchedulerProps,
  TileSourceMetadata
} from '@loaders.gl/loader-utils';
import {DataSource, ImageSource} from '@loaders.gl/loader-utils';
import {
  BaseClient,
  fromArrayBuffer,
  fromCustomClient,
  type GeoTIFF,
  type GeoTIFFImage
} from 'geotiff';
import {RangeRequestClient} from './lib/range-request-client';

const VERSION = '1.0.0';

/** Options for the GeoTIFF map-raster source. */
export type GeoTIFFSourceOptions = DataSourceOptions & {
  geotiff?: {
    /** Whether to read an alpha channel when available. */
    enableAlpha?: boolean;
    /** Output width and height for getTile/getTileData. */
    tileSize?: number;
  };
  tileRangeRequest?: TileRangeRequestSchedulerProps & {
    /** Reserved concurrency hint for range-request transports. */
    maxConcurrentRequests?: number;
  };
};

/** loaders.gl Source descriptor for north-up GeoTIFF / COG image rasters. */
export const GeoTIFFSource = {
  name: 'GeoTIFF',
  id: 'geotiff-source',
  module: 'geotiff',
  version: VERSION,
  extensions: ['geotiff', 'tiff', 'geotif', 'tif'],
  mimeTypes: ['image/tiff', 'image/geotiff'],
  type: 'geotiff',
  fromUrl: true,
  fromBlob: true,

  defaultOptions: {
    geotiff: {
      enableAlpha: true,
      tileSize: 512
    },
    tileRangeRequest: {
      batchDelayMs: 50,
      maxGapBytes: 65536,
      rangeExpansionBytes: 65536,
      maxMergedBytes: 8388608,
      maxConcurrentRequests: 6
    }
  },

  testURL: (url: string): boolean => /\.(geo)?tiff?$|\.tif$/i.test(url),
  createDataSource: (url: string | Blob, options: GeoTIFFSourceOptions): GeoTIFFImageSource =>
    new GeoTIFFImageSource(url, options)
} as const satisfies Source<GeoTIFFImageSource>;

/**
 * Image and image-tile data source for north-up GeoTIFF / COG rasters.
 */
export class GeoTIFFImageSource
  extends DataSource<string | Blob, GeoTIFFSourceOptions>
  implements ImageSource, ImageTileSource
{
  /** Promise that resolves when the GeoTIFF container has been opened. */
  readonly ready: Promise<GeoTIFF>;
  private metadataPromise: Promise<TileSourceMetadata> | null = null;
  private baseImagePromise: Promise<GeoTIFFImage> | null = null;

  /** Creates an image source for a GeoTIFF URL or Blob. */
  constructor(data: string | Blob, options: GeoTIFFSourceOptions = {}) {
    super(data, options, GeoTIFFSource.defaultOptions);
    this.ready = this.openGeoTIFF(data);
    this.getTileData = this.getTileData.bind(this);
  }

  /** Returns tile-source and image-source metadata for the base image. */
  async getMetadata(): Promise<TileSourceMetadata & ImageSourceMetadata> {
    this.metadataPromise ||= this.loadMetadata();
    return (await this.metadataPromise) as TileSourceMetadata & ImageSourceMetadata;
  }

  /** Reads an image window from the GeoTIFF, selecting an overview when available. */
  async getImage(parameters: GetImageParameters): Promise<ImageType> {
    const tiff = await this.ready;
    const baseImage = await this.getBaseImage();
    const boundingBox = parameters.boundingBox || getImageBoundingBox(baseImage);
    const requestedWidth = parameters.width ?? baseImage.getWidth();
    const image = await this.selectImage(tiff, baseImage, boundingBox, requestedWidth);
    const window = getPixelWindow(image, boundingBox);
    const rgbData = await image.readRGB({
      window,
      width: parameters.width,
      height: parameters.height,
      interleave: true,
      enableAlpha: this.options.geotiff?.enableAlpha,
      signal: undefined
    });

    return {
      data: new Uint8Array(rgbData as unknown as ArrayBufferLike),
      width: rgbData.width,
      height: rgbData.height
    };
  }

  /** Reads a Web Mercator tile as an image. */
  async getImageTile(parameters: GetTileParameters): Promise<ImageType | null> {
    return await this.getTile(parameters);
  }

  /** Reads a Web Mercator tile as an image. */
  async getTile(parameters: GetTileParameters): Promise<ImageType | null> {
    const boundingBox = getWebMercatorTileBoundingBox(parameters);
    const tileSize = this.options.geotiff?.tileSize ?? 512;
    return await this.getImage({
      boundingBox,
      layers: [],
      width: tileSize,
      height: tileSize
    });
  }

  /** Reads multiple Web Mercator tiles without requiring callers to await each one sequentially. */
  getTileBatch(parameters: readonly GetTileParameters[]): readonly Promise<ImageType | null>[] {
    return parameters.map(parameter => this.getTile(parameter));
  }

  /** Reads one `getTileData` request as an image. */
  async getTileData(parameters: GetTileDataParameters): Promise<ImageType | null> {
    const tileSize = this.options.geotiff?.tileSize ?? 512;
    const boundingBox = getBoundingBoxFromTileDataParameters(parameters);
    return await this.getImage({
      boundingBox,
      layers: [],
      width: tileSize,
      height: tileSize
    });
  }

  /** Reads multiple `getTileData` requests without requiring callers to await each one sequentially. */
  getTileDataBatch(
    parameters: readonly GetTileDataParameters[]
  ): readonly Promise<ImageType | null>[] {
    return parameters.map(parameter => this.getTileData(parameter));
  }

  /** Opens a Blob directly or a URL through the scheduled range-request client. */
  private async openGeoTIFF(data: string | Blob): Promise<GeoTIFF> {
    if (typeof data !== 'string') {
      return await fromArrayBuffer(await data.arrayBuffer());
    }

    const client = new RangeRequestClient(this.url, {
      ...this.options.tileRangeRequest,
      fetch: this.fetch
    });
    return await fromCustomClient(client as unknown as BaseClient, {maxRanges: 0});
  }

  /** Loads metadata from the base GeoTIFF image. */
  private async loadMetadata(): Promise<TileSourceMetadata & ImageSourceMetadata> {
    const image = await this.getBaseImage();
    const [west, south, east, north] = image.getBoundingBox();
    const geoKeys = image.getGeoKeys();
    return {
      name: this.url || 'geotiff',
      format: 'geotiff',
      keywords: [],
      layers: [],
      layer: {
        name: this.url || 'geotiff',
        boundingBox: [west, south, east, north],
        layers: []
      },
      boundingBox: [
        [west, south],
        [east, north]
      ],
      formatHeader: {geoKeys, fileDirectory: image.getFileDirectory()}
    };
  }

  /** Returns the highest-resolution image in the GeoTIFF. */
  private async getBaseImage(): Promise<GeoTIFFImage> {
    this.baseImagePromise ||= this.ready.then(tiff => tiff.getImage(0));
    return await this.baseImagePromise;
  }

  /** Chooses the smallest overview that can satisfy the requested output resolution. */
  private async selectImage(
    tiff: GeoTIFF,
    baseImage: GeoTIFFImage,
    boundingBox: [min: [x: number, y: number], max: [x: number, y: number]],
    width: number
  ): Promise<GeoTIFFImage> {
    const imageCount = await tiff.getImageCount();
    const targetResolution = Math.abs(boundingBox[1][0] - boundingBox[0][0]) / width;
    let selectedImage = baseImage;
    let selectedResolution = Math.abs(baseImage.getResolution()[0]);

    for (let imageIndex = 1; imageIndex < imageCount; imageIndex++) {
      const image = await tiff.getImage(imageIndex); // eslint-disable-line no-await-in-loop
      const resolution = Math.abs(image.getResolution(baseImage)[0]);
      if (resolution <= targetResolution && resolution > selectedResolution) {
        selectedImage = image;
        selectedResolution = resolution;
      }
    }

    return selectedImage;
  }
}

/**
 * Returns a geographic bounding box for a GeoTIFF image.
 */
function getImageBoundingBox(
  image: GeoTIFFImage
): [min: [x: number, y: number], max: [x: number, y: number]] {
  const [west, south, east, north] = image.getBoundingBox();
  return [
    [west, south],
    [east, north]
  ];
}

/** Converts a geographic bounding box into a clipped GeoTIFF pixel window. */
function getPixelWindow(
  image: GeoTIFFImage,
  boundingBox: [min: [x: number, y: number], max: [x: number, y: number]]
): [number, number, number, number] {
  const [originX, originY] = image.getOrigin();
  const [resolutionX, resolutionY] = image.getResolution();
  const [[west, south], [east, north]] = boundingBox;

  const left = Math.floor((west - originX) / resolutionX);
  const right = Math.ceil((east - originX) / resolutionX);
  const top = Math.floor((north - originY) / resolutionY);
  const bottom = Math.ceil((south - originY) / resolutionY);

  return [left, top, right, bottom].map((value, index) =>
    clamp(value, 0, index % 2 === 0 ? image.getWidth() : image.getHeight())
  ) as [number, number, number, number];
}

/** Converts deck.gl tile-data parameters into the GeoTIFF Source bounding-box shape. */
function getBoundingBoxFromTileDataParameters(
  parameters: GetTileDataParameters
): [min: [x: number, y: number], max: [x: number, y: number]] {
  const {bbox} = parameters;
  return 'west' in bbox
    ? [
        [bbox.west, bbox.south],
        [bbox.east, bbox.north]
      ]
    : [
        [bbox.left, bbox.bottom],
        [bbox.right, bbox.top]
      ];
}

/** Returns a longitude/latitude bounding box for a Web Mercator tile. */
function getWebMercatorTileBoundingBox(
  parameters: GetTileParameters
): [min: [x: number, y: number], max: [x: number, y: number]] {
  const west = tileXToLongitude(parameters.x, parameters.z);
  const east = tileXToLongitude(parameters.x + 1, parameters.z);
  const north = tileYToLatitude(parameters.y, parameters.z);
  const south = tileYToLatitude(parameters.y + 1, parameters.z);
  return [
    [west, south],
    [east, north]
  ];
}

/** Converts a Web Mercator tile x coordinate into longitude. */
function tileXToLongitude(x: number, z: number): number {
  return (x / 2 ** z) * 360 - 180;
}

/** Converts a Web Mercator tile y coordinate into latitude. */
function tileYToLatitude(y: number, z: number): number {
  const radians = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / 2 ** z)));
  return (radians * 180) / Math.PI;
}

/** Clips a value to the closed interval `[min, max]`. */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
