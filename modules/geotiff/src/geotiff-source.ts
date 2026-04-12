// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GeoTIFF as GeoTIFFDataset, GeoTIFFImage} from 'geotiff';
import {fromBlob, fromCustomClient} from 'geotiff';

import type {
  Source,
  DataSourceOptions,
  TypedArray,
  RasterSource,
  RasterSourceMetadata,
  GetRasterParameters,
  RasterData,
  RasterChannelDataType,
  RasterBoundingBox,
  RangeRequestSchedulerProps
} from '@loaders.gl/loader-utils';
import {
  DataSource,
  getRasterViewportBoundingBox,
  RangeRequestScheduler
} from '@loaders.gl/loader-utils';

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
    /** Optional shared scheduler used for byte-range requests against remote GeoTIFFs. */
    rangeScheduler?: RangeRequestScheduler;
    /** Optional scheduler configuration used when creating a per-source byte-range scheduler. */
    rangeSchedulerProps?: RangeRequestSchedulerProps;
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

  testURL: (url: string): boolean => {
    if (/\.ome\.tiff?(?:$|[?#])/i.test(url)) {
      return false;
    }
    return /\.(?:geotiff?|tiff?)(?:$|[?#])/i.test(url);
  },
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
  private _rangeScheduler: RangeRequestScheduler | null = null;

  constructor(data: string | Blob, options: GeoTIFFSourceOptions) {
    super(data, options, GeoTIFFSource.defaultOptions);

    if (options.geotiff?.rangeSchedulerProps) {
      this.options.geotiff ||= {};
      this.options.geotiff.rangeSchedulerProps = options.geotiff.rangeSchedulerProps;
    }

    if (options.geotiff?.rangeScheduler) {
      this.options.geotiff ||= {};
      this.options.geotiff.rangeScheduler = options.geotiff.rangeScheduler;
    }
  }

  async getMetadata(): Promise<RasterSourceMetadata> {
    const {metadata} = await this._getInitPromise();
    return metadata;
  }

  async getRaster(parameters: GetRasterParameters): Promise<RasterData> {
    const {tiff, metadata} = await this._getInitPromise();
    const viewportBoundingBox = getRasterViewportBoundingBox(parameters.viewport);
    const viewportCrs = parameters.viewport.crs;

    if (parameters.signal?.aborted) {
      throw new Error('Request aborted');
    }

    if (metadata.crs && viewportCrs && metadata.crs !== viewportCrs) {
      throw new Error(
        `GeoTIFFRasterSource does not support reprojection. Requested ${viewportCrs}, source ${metadata.crs}.`
      );
    }

    if (!metadata.boundingBox) {
      throw new Error('GeoTIFFRasterSource requires source bounds to fulfill viewport requests.');
    }

    const clippedBoundingBox = intersectBoundingBoxes(viewportBoundingBox, metadata.boundingBox);
    if (!clippedBoundingBox) {
      return createEmptyRaster(parameters, metadata);
    }

    const targetSize = getClippedTargetSize(viewportBoundingBox, clippedBoundingBox, parameters);
    const interleaved = parameters.interleaved ?? this.options.geotiff?.interleaved ?? false;
    const fillValue = metadata.noData ?? undefined;
    const raster = (await tiff.readRasters({
      bbox: flattenBoundingBox(clippedBoundingBox),
      width: targetSize.width,
      height: targetSize.height,
      samples: parameters.bands,
      interleave: interleaved,
      resampleMethod: parameters.resampleMethod ?? this.options.geotiff?.resampleMethod,
      fillValue
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
      boundingBox: clippedBoundingBox,
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
      return await fromCustomClient(
        new GeoTIFFRangeSchedulerClient({
          url: this.url,
          fetch: this.fetch,
          sourceId: this.url,
          headers: this.options.geotiff?.headers,
          rangeScheduler: this._getRangeScheduler()
        }) as never,
        {
          headers: this.options.geotiff?.headers,
          maxRanges: 0
        }
      );
    }

    return await fromBlob(this.data);
  }

  private _getRangeScheduler(): RangeRequestScheduler {
    if (this.options.geotiff?.rangeScheduler) {
      return this.options.geotiff.rangeScheduler;
    }

    if (!this._rangeScheduler) {
      this._rangeScheduler = new RangeRequestScheduler({
        batchDelayMs: 0,
        ...this.options.geotiff?.rangeSchedulerProps
      });
    }

    return this._rangeScheduler;
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

/** Computes the overlap between two source-coordinate bounding boxes. */
function intersectBoundingBoxes(
  leftBoundingBox: RasterBoundingBox,
  rightBoundingBox: RasterBoundingBox
): RasterBoundingBox | null {
  const minX = Math.max(leftBoundingBox[0][0], rightBoundingBox[0][0]);
  const minY = Math.max(leftBoundingBox[0][1], rightBoundingBox[0][1]);
  const maxX = Math.min(leftBoundingBox[1][0], rightBoundingBox[1][0]);
  const maxY = Math.min(leftBoundingBox[1][1], rightBoundingBox[1][1]);

  if (maxX <= minX || maxY <= minY) {
    return null;
  }

  return [
    [minX, minY],
    [maxX, maxY]
  ];
}

/** Scales the output raster size to the portion of the viewport that intersects the source. */
function getClippedTargetSize(
  viewportBoundingBox: RasterBoundingBox,
  clippedBoundingBox: RasterBoundingBox,
  parameters: GetRasterParameters
): {width: number; height: number} {
  const viewportWidth = Math.abs(viewportBoundingBox[1][0] - viewportBoundingBox[0][0]);
  const viewportHeight = Math.abs(viewportBoundingBox[1][1] - viewportBoundingBox[0][1]);
  const clippedWidth = Math.abs(clippedBoundingBox[1][0] - clippedBoundingBox[0][0]);
  const clippedHeight = Math.abs(clippedBoundingBox[1][1] - clippedBoundingBox[0][1]);

  return {
    width: Math.max(
      1,
      Math.min(
        parameters.viewport.width,
        Math.round((clippedWidth / Math.max(viewportWidth, Number.EPSILON)) * parameters.viewport.width)
      )
    ),
    height: Math.max(
      1,
      Math.min(
        parameters.viewport.height,
        Math.round(
          (clippedHeight / Math.max(viewportHeight, Number.EPSILON)) * parameters.viewport.height
        )
      )
    )
  };
}

/** Creates a no-data raster payload when the viewport does not overlap the dataset. */
function createEmptyRaster(
  parameters: GetRasterParameters,
  metadata: RasterSourceMetadata
): RasterData {
  const length = parameters.viewport.width * parameters.viewport.height;
  const bandCount = parameters.bands?.length ?? metadata.bandCount;
  const interleaved = parameters.interleaved ?? false;
  const noData = metadata.noData ?? 0;
  const data = interleaved
    ? createFilledTypedArray(metadata.dtype, length * bandCount, noData)
    : bandCount === 1
      ? createFilledTypedArray(metadata.dtype, length, noData)
      : Array.from({length: bandCount}, () => createFilledTypedArray(metadata.dtype, length, noData));

  return {
    data,
    width: parameters.viewport.width,
    height: parameters.viewport.height,
    bandCount,
    dtype: metadata.dtype,
    interleaved,
    noData: metadata.noData,
    boundingBox: getRasterViewportBoundingBox(parameters.viewport),
    crs: metadata.crs,
    metadata: metadata.metadata
  };
}

/** Allocates a typed array for the requested raster channel type and fills it with one value. */
function createFilledTypedArray(
  dtype: RasterChannelDataType,
  length: number,
  fillValue: number
): TypedArray {
  switch (dtype) {
    case 'uint8':
      return new Uint8Array(length).fill(fillValue);
    case 'uint16':
      return new Uint16Array(length).fill(fillValue);
    case 'uint32':
      return new Uint32Array(length).fill(fillValue);
    case 'int8':
      return new Int8Array(length).fill(fillValue);
    case 'int16':
      return new Int16Array(length).fill(fillValue);
    case 'int32':
      return new Int32Array(length).fill(fillValue);
    case 'float32':
      return new Float32Array(length).fill(fillValue);
    case 'float64':
      return new Float64Array(length).fill(fillValue);
    default:
      return new Uint8Array(length).fill(fillValue);
  }
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

type GeoTIFFRangeSchedulerClientProps = {
  url: string;
  fetch: (url: string, options?: RequestInit) => Promise<Response>;
  sourceId: string;
  headers?: HeadersInit;
  rangeScheduler: RangeRequestScheduler;
};

class GeoTIFFRangeSchedulerResponse {
  private readonly arrayBuffer: ArrayBuffer;
  private readonly headers: Headers;
  readonly status: number;

  constructor(arrayBuffer: ArrayBuffer, headers: Headers, status = 206) {
    this.arrayBuffer = arrayBuffer;
    this.headers = headers;
    this.status = status;
  }

  get ok(): boolean {
    return this.status >= 200 && this.status <= 299;
  }

  getHeader(name: string): string {
    return this.headers.get(name) || '';
  }

  async getData(): Promise<ArrayBuffer> {
    return this.arrayBuffer;
  }
}

class GeoTIFFRangeSchedulerClient {
  readonly url: string;

  private readonly fetch: GeoTIFFRangeSchedulerClientProps['fetch'];
  private readonly sourceId: string;
  private readonly defaultHeaders?: HeadersInit;
  private readonly rangeScheduler: RangeRequestScheduler;
  private fileSize: number | null = null;

  constructor(props: GeoTIFFRangeSchedulerClientProps) {
    this.url = props.url;
    this.fetch = props.fetch;
    this.sourceId = props.sourceId;
    this.defaultHeaders = props.headers;
    this.rangeScheduler = props.rangeScheduler;
  }

  async request({
    headers,
    signal
  }: {
    headers?: HeadersInit;
    signal?: AbortSignal;
  } = {}): Promise<GeoTIFFRangeSchedulerResponse> {
    const mergedHeaders = new Headers(this.defaultHeaders);
    new Headers(headers).forEach((value, key) => mergedHeaders.set(key, value));

    const rangeHeader = mergedHeaders.get('Range');
    const {offset, length} = parseSingleRangeHeader(rangeHeader);
    const requestHeaders = new Headers(mergedHeaders);
    requestHeaders.delete('Range');

    const arrayBuffer = await this.rangeScheduler.scheduleRequest({
      sourceId: this.sourceId,
      offset,
      length,
      signal,
      fetchRange: async (transportOffset, transportLength, transportSignal) =>
        await this._fetchRange(transportOffset, transportLength, requestHeaders, transportSignal)
    });

    const endOffset = offset + arrayBuffer.byteLength - 1;
    const responseHeaders = new Headers({
      'Content-Range': `bytes ${offset}-${endOffset}/${this.fileSize ?? endOffset + 1}`
    });

    return new GeoTIFFRangeSchedulerResponse(arrayBuffer, responseHeaders);
  }

  private async _fetchRange(
    offset: number,
    length: number,
    headers: Headers,
    signal?: AbortSignal
  ): Promise<ArrayBuffer> {
    let response = await this.fetch(this.url, {
      headers: createRangeRequestHeaders(headers, offset, length),
      signal
    });

    if (response.status === 416 && offset === 0) {
      const actualLength = parseUnsatisfiedContentRange(response.headers.get('Content-Range'));
      if (!actualLength) {
        throw new Error('Missing content-length on 416 response');
      }
      response = await this.fetch(this.url, {
        headers: createRangeRequestHeaders(headers, 0, actualLength),
        signal
      });
    }

    if (response.status === 200) {
      await response.body?.cancel().catch(() => {});
      throw new Error('Byte-range request failed: server returned 200 instead of 206');
    }

    if (response.status !== 206 && !response.ok) {
      throw new Error(`Bad response code: ${response.status}`);
    }

    const contentRange = response.headers.get('Content-Range');
    if (contentRange) {
      const total = parseContentRangeTotal(contentRange);
      if (total !== null) {
        this.fileSize = total;
      }
    }

    return await response.arrayBuffer();
  }
}

function createRangeRequestHeaders(headers: Headers, offset: number, length: number): Headers {
  const requestHeaders = new Headers(headers);
  requestHeaders.set('Range', `bytes=${offset}-${offset + length - 1}`);
  return requestHeaders;
}

function parseSingleRangeHeader(rangeHeader: string | null): {offset: number; length: number} {
  const match = rangeHeader?.match(/^bytes=(\d+)-(\d+)$/);
  if (!match) {
    throw new Error(`GeoTIFF range request requires a single byte range. Received: ${rangeHeader}`);
  }

  const offset = Number(match[1]);
  const exclusiveEndOffset = Number(match[2]);
  return {offset, length: exclusiveEndOffset - offset};
}

function parseContentRangeTotal(contentRange: string): number | null {
  const match = contentRange.match(/^bytes \d+-\d+\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

function parseUnsatisfiedContentRange(contentRange: string | null): number | null {
  const match = contentRange?.match(/^bytes \*\/(\d+)$/);
  return match ? Number(match[1]) : null;
}
