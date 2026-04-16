// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GeoTIFF as GeoTIFFDataset} from 'geotiff';
import {fromBlob, fromUrl} from 'geotiff';

import type {
  SourceLoader,
  DataSourceOptions,
  RasterData,
  RasterChannelDataType,
  TypedArray
} from '@loaders.gl/loader-utils';
import {DataSource} from '@loaders.gl/loader-utils';

import type {TiffPixelSource} from './lib/tiff-pixel-source';
import {loadOmeTiff, isOmeTiff} from './lib/ome/load-ome-tiff';
import {ensureArray, getImageSize, intToRgba} from './lib/utils/tiff-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Parameters used to request a 2D OME-TIFF plane.
 */
export type GetOMETiffParameters = {
  /** Zero-based pyramid level. Defaults to `0`. */
  level?: number;
  /** Zero-based time index. Defaults to `0`. */
  t?: number;
  /** Zero-based z index. Defaults to `0`. */
  z?: number;
  /** Zero-based channel indices to load. Defaults to the first RGB-capable set. */
  channels?: number[];
  /** Whether to interleave multi-channel results into one typed array. */
  interleaved?: boolean;
  /** Abort signal forwarded to the underlying read. */
  signal?: AbortSignal;
};

/**
 * Channel metadata exposed by {@link OMETiffSourceLoaderMetadata}.
 */
export type OMETiffChannelMetadata = {
  /** Zero-based OME channel index. */
  index: number;
  /** Optional channel label from OME-XML metadata. */
  name?: string;
  /** Optional display color decoded from OME-XML metadata. */
  color?: [number, number, number, number];
  /** Samples-per-pixel metadata when present. */
  samplesPerPixel?: number;
};

/**
 * Pyramid level metadata exposed by {@link OMETiffSourceLoaderMetadata}.
 */
export type OMETiffLevelMetadata = {
  /** Zero-based pyramid level. */
  level: number;
  /** Width of the level in pixels. */
  width: number;
  /** Height of the level in pixels. */
  height: number;
};

/**
 * Metadata exposed by {@link OMETiffImageSource}.
 */
export type OMETiffSourceLoaderMetadata = {
  /** OME image name when present. */
  name?: string;
  /** Full-resolution width in pixels. */
  width: number;
  /** Full-resolution height in pixels. */
  height: number;
  /** Number of channels available in the image. */
  bandCount: number;
  /** Numeric channel type. */
  dtype: RasterChannelDataType;
  /** Number of time indices. */
  sizeT: number;
  /** Number of z slices. */
  sizeZ: number;
  /** Number of channels. */
  sizeC: number;
  /** Dimension labels reported by the OME source. */
  labels: string[];
  /** Tile dimensions for the source pyramid. */
  tileSize?: {width: number; height: number};
  /** Pyramid levels available in the source. */
  levels: OMETiffLevelMetadata[];
  /** Channel metadata derived from OME-XML. */
  channels: OMETiffChannelMetadata[];
  /** Physical pixel sizes when present. */
  physicalSizes?: Record<string, {size: number; unit: string}>;
  /** Raw OME-XML-derived metadata for the first image. */
  metadata: Record<string, unknown>;
};

/**
 * Options for creating an OME-TIFF source.
 */
export type OMETiffSourceLoaderOptions = DataSourceOptions & {
  ometiff?: {
    /** Optional request headers forwarded to remote OME-TIFF fetches. */
    headers?: Record<string, string>;
    /** Whether multi-channel reads should default to interleaved output. */
    interleaved?: boolean;
    /** Optional default channels used when a request omits `channels`. */
    defaultChannels?: number[];
  };
};

type OMETiffInit = {
  data: TiffPixelSource<string[]>[];
  metadata: OMETiffSourceLoaderMetadata;
};

/**
 * Source factory for non-geospatial OME-TIFF plane data.
 */
export const OMETiffSourceLoader = {
  dataType: null as unknown as OMETiffImageSource,
  batchType: null as never,
  name: 'OMETiffSourceLoader',
  id: 'ometiff',
  module: 'geotiff',
  version: VERSION,
  extensions: ['ome.tif', 'ome.tiff'],
  mimeTypes: ['image/tiff'],
  type: 'ometiff',
  fromUrl: true,
  fromBlob: true,

  options: {
    ometiff: {
      headers: undefined!,
      interleaved: false,
      defaultChannels: undefined!
    }
  },

  defaultOptions: {
    ometiff: {
      headers: undefined!,
      interleaved: false,
      defaultChannels: undefined!
    }
  },

  testURL: (url: string): boolean => /\.ome\.tiff?(?:$|[?#])/i.test(url),
  createDataSource: (
    data: string | Blob,
    options: OMETiffSourceLoaderOptions
  ): OMETiffImageSource => new OMETiffImageSource(data, options)
} as const satisfies SourceLoader<OMETiffImageSource>;

/**
 * Source that loads 2D planes from an OME-TIFF pyramid.
 */
export class OMETiffImageSource extends DataSource<string | Blob, OMETiffSourceLoaderOptions> {
  private _initPromise: Promise<OMETiffInit> | null = null;

  /**
   * Returns normalized OME-TIFF metadata for the first image in the file.
   */
  async getMetadata(): Promise<OMETiffSourceLoaderMetadata> {
    const {metadata} = await this._getInitPromise();
    return metadata;
  }

  /**
   * Loads one 2D OME-TIFF plane or channel composite.
   */
  async getRaster(parameters: GetOMETiffParameters = {}): Promise<RasterData> {
    const {data, metadata} = await this._getInitPromise();
    const level = parameters.level ?? 0;
    const pixelSource = data[level];

    if (!pixelSource) {
      throw new Error(`OME-TIFF pyramid level ${level} is not available.`);
    }

    const channels = normalizeChannelSelection(
      parameters.channels,
      metadata.bandCount,
      this.options.ometiff?.defaultChannels
    );
    const selection = {
      t: parameters.t ?? 0,
      z: parameters.z ?? 0
    };
    const interleaved = parameters.interleaved ?? this.options.ometiff?.interleaved ?? false;

    const rasters = await Promise.all(
      channels.map(channel =>
        pixelSource.getRaster({
          selection: {...selection, c: channel},
          signal: parameters.signal
        })
      )
    );

    const {width, height} = rasters[0];
    const channelData = rasters.map(raster => raster.data as TypedArray);

    return {
      data: interleaved
        ? interleaveTypedArrays(channelData, metadata.dtype)
        : channelData.length === 1
          ? channelData[0]
          : channelData,
      width,
      height,
      bandCount: channelData.length,
      dtype: metadata.dtype,
      interleaved,
      metadata: {
        selection,
        channels,
        level,
        sourceLabels: metadata.labels
      }
    };
  }

  /** Returns the shared initialization promise for this source instance. */
  private _getInitPromise(): Promise<OMETiffInit> {
    if (!this._initPromise) {
      this._initPromise = this._initialize();
    }

    return this._initPromise;
  }

  /** Opens the OME-TIFF once and resolves its pixel sources and normalized metadata. */
  private async _initialize(): Promise<OMETiffInit> {
    const tiff = await this._openTiff();
    const firstImage = await tiff.getImage(0);

    if (!isOmeTiff(firstImage)) {
      throw new Error('OMETiffImageSource requires an OME-TIFF input.');
    }

    const loaded = await loadOmeTiff(tiff, firstImage);
    return {
      data: loaded.data,
      metadata: normalizeOMETiffMetadata(this.data, loaded)
    };
  }

  /** Opens the backing OME-TIFF from a URL or Blob input. */
  private async _openTiff(): Promise<GeoTIFFDataset> {
    if (typeof this.data === 'string') {
      return await fromUrl(this.url, this.options.ometiff?.headers as Record<string, unknown>);
    }

    return await fromBlob(this.data);
  }
}

/**
 * Normalizes the first OME image metadata into a public source shape.
 */
function normalizeOMETiffMetadata(
  data: string | Blob,
  loaded: {data: TiffPixelSource<string[]>[]; metadata: Record<string, any>}
): OMETiffSourceLoaderMetadata {
  const baseSource = loaded.data[0];
  const {width, height} = getImageSize(baseSource);
  const pixels = loaded.metadata.Pixels;

  return {
    name: loaded.metadata.Name || getOMETiffName(data),
    width,
    height,
    bandCount: pixels.SizeC,
    dtype: baseSource.dtype,
    sizeT: pixels.SizeT,
    sizeZ: pixels.SizeZ,
    sizeC: pixels.SizeC,
    labels: [...baseSource.labels],
    tileSize: {
      width: baseSource.tileSize,
      height: baseSource.tileSize
    },
    levels: loaded.data.map((source, level) => {
      const imageSize = getImageSize(source);
      return {level, width: imageSize.width, height: imageSize.height};
    }),
    channels: ensureArray(pixels.Channels || []).map((channel: Record<string, any>, index) => ({
      index,
      name: channel.Name,
      color: Number.isInteger(channel.Color) ? intToRgba(channel.Color) : undefined,
      samplesPerPixel: channel.SamplesPerPixel
    })),
    physicalSizes: baseSource.meta?.physicalSizes as Record<string, {size: number; unit: string}>,
    metadata: loaded.metadata
  };
}

/**
 * Applies source defaults when a plane request omits channel selection.
 */
function normalizeChannelSelection(
  channels: number[] | undefined,
  bandCount: number,
  defaultChannels?: number[]
): number[] {
  const resolvedChannels =
    channels && channels.length
      ? channels
      : defaultChannels && defaultChannels.length
        ? defaultChannels
        : bandCount >= 3
          ? [0, 1, 2]
          : [0];

  for (const channel of resolvedChannels) {
    if (channel < 0 || channel >= bandCount) {
      throw new Error(`OME-TIFF channel ${channel} is out of bounds for ${bandCount} channels.`);
    }
  }

  return resolvedChannels;
}

/**
 * Interleaves one typed array per channel into one upload-ready raster buffer.
 */
function interleaveTypedArrays(arrays: TypedArray[], dtype: RasterChannelDataType): TypedArray {
  if (arrays.length === 1) {
    return arrays[0];
  }

  const output = createTypedArray(dtype, arrays[0].length * arrays.length);
  let outputIndex = 0;

  for (let pixelIndex = 0; pixelIndex < arrays[0].length; pixelIndex++) {
    for (let channelIndex = 0; channelIndex < arrays.length; channelIndex++) {
      output[outputIndex++] = arrays[channelIndex][pixelIndex];
    }
  }

  return output;
}

/**
 * Allocates a typed array matching the requested raster data type.
 */
function createTypedArray(dtype: RasterChannelDataType, length: number): TypedArray {
  switch (dtype) {
    case 'uint8':
      return new Uint8Array(length);
    case 'uint16':
      return new Uint16Array(length);
    case 'uint32':
      return new Uint32Array(length);
    case 'int8':
      return new Int8Array(length);
    case 'int16':
      return new Int16Array(length);
    case 'int32':
      return new Int32Array(length);
    case 'float32':
      return new Float32Array(length);
    case 'float64':
      return new Float64Array(length);
    default:
      throw new Error(`Unsupported raster channel type: ${dtype}.`);
  }
}

/**
 * Derives a friendly OME-TIFF filename from a URL when possible.
 */
function getOMETiffName(data: string | Blob): string | undefined {
  if (typeof data !== 'string') {
    return undefined;
  }

  const [path] = data.split(/[?#]/);
  return path.split('/').pop() || undefined;
}
