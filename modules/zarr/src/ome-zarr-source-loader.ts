// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as zarrita from 'zarrita';
import type {Readable} from 'zarrita';
import type {SourceLoader, DataSourceOptions, RasterData, RasterChannelDataType} from '@loaders.gl/loader-utils';
import {DataSource} from '@loaders.gl/loader-utils';

import type {Labels, Channel, RootAttrs, SupportedTypedArray} from './types';
import {guessLabels, guessTileSize, isInterleaved, validLabels} from './lib/utils';
import ZarritaPixelSource from './lib/zarrita-pixel-source';
import {loadConsolidatedMetadata, type ZarrConsolidatedMetadata} from './lib/consolidated-zarr';
export type {ZarrConsolidatedMetadata} from './lib/consolidated-zarr';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type ZarrSourceLoaderOptions = DataSourceOptions & {
  zarr?: {
    metadataPath?: 'auto' | '.zmetadata' | 'zmetadata' | 'zarr.json';
    path?: string | null;
    labels?: string[];
    requireConsolidatedMetadata?: boolean;
  };
  omezarr?: {
    interleaved?: boolean;
    defaultChannels?: number[];
  };
};

export type ZarrSourceLoader<SourceT extends ZarrSource = ZarrSource> = SourceLoader<
  SourceT,
  ZarrSourceLoaderOptions
>;

export type GetOMEZarrParameters = {
  level?: number;
  t?: number;
  z?: number;
  channels?: number[];
  interleaved?: boolean;
  signal?: AbortSignal;
};

export type OMEZarrChannelMetadata = {
  index: number;
  name?: string;
  color?: string;
  active?: boolean;
};

export type OMEZarrLevelMetadata = {
  level: number;
  path: string;
  width: number;
  height: number;
};

export type OMEZarrSourceLoaderMetadata = {
  name?: string;
  width: number;
  height: number;
  bandCount: number;
  dtype: RasterChannelDataType;
  sizeT: number;
  sizeZ: number;
  sizeC: number;
  labels: string[];
  tileSize?: {width: number; height: number};
  levels: OMEZarrLevelMetadata[];
  channels: OMEZarrChannelMetadata[];
  metadata: Record<string, unknown>;
  coordinateTransformations?: unknown[];
};

type OMEZarrInit = {
  data: ZarritaPixelSource<string[]>[];
  metadata: OMEZarrSourceLoaderMetadata;
};

/**
 * Loads consolidated metadata for a Zarr store root and extracts top-level groups.
 */
export async function loadZarrConsolidatedMetadata(
  url: string,
  options: {
    metadataPath?: 'auto' | '.zmetadata' | 'zmetadata' | 'zarr.json';
    fetch?: (url: string, options?: RequestInit) => Promise<Response>;
    signal?: AbortSignal;
  } = {}
): Promise<ZarrConsolidatedMetadata> {
  const fetcher = options.fetch || fetch;
  return await loadConsolidatedMetadata(url, fetcher, options);
}

/**
 * Base runtime source for Zarr-backed sources that resolve groups and consolidated metadata.
 */
export abstract class ZarrSource extends DataSource<string, ZarrSourceLoaderOptions> {
  protected readonly store: zarrita.FetchStore;
  protected readonly path: string | null;
  private consolidatedMetadataPromise: Promise<ZarrConsolidatedMetadata> | null = null;

  constructor(data: string, options: ZarrSourceLoaderOptions) {
    super(data, options, {
      zarr: {
        metadataPath: 'auto',
        path: null,
        labels: undefined!,
        requireConsolidatedMetadata: true
      },
      omezarr: {
        interleaved: false,
        defaultChannels: undefined!
      }
    });

    this.path = this.options.zarr?.path || null;
    this.store = new zarrita.FetchStore(this.url, {
      fetch: async (request: Request) => {
        const headers = Object.fromEntries(request.headers.entries());
        return await this.fetch(request.url, {
          method: request.method,
          headers,
          signal: request.signal
        });
      }
    });
  }

  async getConsolidatedMetadata(signal?: AbortSignal): Promise<ZarrConsolidatedMetadata> {
    if (!this.consolidatedMetadataPromise) {
      this.consolidatedMetadataPromise = loadConsolidatedMetadata(this.url, this.fetch, {
        metadataPath: this.options.zarr?.metadataPath,
        signal
      });
    }

    return await this.consolidatedMetadataPromise;
  }

  protected async openGroup(signal?: AbortSignal): Promise<zarrita.Group<Readable>> {
    if (this.options.zarr?.requireConsolidatedMetadata) {
      await this.getConsolidatedMetadata(signal);
    }

    const location = this.path ? zarrita.root(this.store).resolve(this.path) : this.store;
    return await zarrita.open(location, {kind: 'group', signal});
  }
}

/**
 * Source factory for OME-Zarr multiscale images and labels.
 */
export const OMEZarrSourceLoader = {
  dataType: null as unknown as OMEZarrImageSource,
  batchType: null as never,
  name: 'OMEZarrSourceLoader',
  id: 'omezarr',
  module: 'zarr',
  version: VERSION,
  extensions: ['zarr'],
  mimeTypes: ['application/vnd+zarr'],
  type: 'omezarr',
  fromUrl: true,
  fromBlob: false,

  options: {
    zarr: {
      metadataPath: 'auto',
      path: null,
      labels: undefined!,
      requireConsolidatedMetadata: true
    },
    omezarr: {
      interleaved: false,
      defaultChannels: undefined!
    }
  },

  defaultOptions: {
    zarr: {
      metadataPath: 'auto',
      path: null,
      labels: undefined!,
      requireConsolidatedMetadata: true
    },
    omezarr: {
      interleaved: false,
      defaultChannels: undefined!
    }
  },

  testURL: (url: string): boolean => /\.zarr(?:$|[/?#])/i.test(url),
  createDataSource: (
    data: string,
    options: ZarrSourceLoaderOptions
  ): OMEZarrImageSource => new OMEZarrImageSource(data, options)
} as const satisfies ZarrSourceLoader<OMEZarrImageSource>;

/**
 * Source that loads 2D planes from an OME-Zarr pyramid.
 */
export class OMEZarrImageSource extends ZarrSource {
  private initPromise: Promise<OMEZarrInit> | null = null;

  async getMetadata(): Promise<OMEZarrSourceLoaderMetadata> {
    const {metadata} = await this.getInitPromise();
    return metadata;
  }

  async getRaster(parameters: GetOMEZarrParameters = {}): Promise<RasterData> {
    const {data, metadata} = await this.getInitPromise();
    const level = parameters.level ?? 0;
    const pixelSource = data[level];

    if (!pixelSource) {
      throw new Error(`OME-Zarr pyramid level ${level} is not available.`);
    }

    const interleavedSource = metadata.labels.includes('_c');
    const interleaved = parameters.interleaved ?? this.options.omezarr?.interleaved ?? interleavedSource;
    const selection = {
      t: parameters.t ?? 0,
      z: parameters.z ?? 0
    };
    const channels = normalizeChannelSelection(
      parameters.channels,
      metadata.bandCount,
      this.options.omezarr?.defaultChannels
    );

    if (interleavedSource) {
      const raster = await pixelSource.getRaster({selection, signal: parameters.signal});
      const rawData = raster.data as SupportedTypedArray;
      const channelData = selectInterleavedChannels(rawData, metadata.bandCount, channels, interleaved);
      return {
        data: channelData,
        width: raster.width,
        height: raster.height,
        bandCount: channels.length,
        dtype: metadata.dtype,
        interleaved,
        metadata: {selection, channels, level, sourceLabels: metadata.labels}
      };
    }

    const rasters = await Promise.all(
      channels.map(channel =>
        pixelSource.getRaster({
          selection: {...selection, c: channel},
          signal: parameters.signal
        })
      )
    );

    const {width, height} = rasters[0];
    const channelData = rasters.map(raster => raster.data as SupportedTypedArray);

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
      metadata: {selection, channels, level, sourceLabels: metadata.labels}
    };
  }

  private getInitPromise(): Promise<OMEZarrInit> {
    if (!this.initPromise) {
      this.initPromise = this.initialize();
    }

    return this.initPromise;
  }

  private async initialize(): Promise<OMEZarrInit> {
    const group = await this.openGroup();
    const attrs = normalizeRootAttrs(group.attrs as unknown as RootAttrs);
    const datasets = attrs.multiscales?.[0]?.datasets;

    if (!datasets?.length) {
      throw new Error('OMEZarrImageSource requires multiscales metadata on the selected group.');
    }

    const arrays = await Promise.all(
      datasets.map(dataset => zarrita.open(group.resolve(dataset.path), {kind: 'array'}))
    );

    const labels = inferLabels(attrs, arrays[0], this.options.zarr?.labels);
    const tileSize = guessTileSize({shape: arrays[0].shape, chunks: arrays[0].chunks});
    const data = arrays.map(array => new ZarritaPixelSource(array, labels, tileSize));

    return {
      data,
      metadata: normalizeOMEZarrMetadata(this.data, attrs, data)
    };
  }
}

function normalizeRootAttrs(attrs: RootAttrs): {
  multiscales: NonNullable<RootAttrs['multiscales']>;
  omero: {channels?: Channel[]; name?: string; rdefs?: {defaultT?: number; defaultZ?: number; model: string}};
  coordinateTransformations?: unknown[];
} {
  const omeAttrs = 'ome' in attrs && attrs.ome ? attrs.ome : null;

  return {
    multiscales: attrs.multiscales || omeAttrs?.multiscales || [],
    omero: ('omero' in attrs ? attrs.omero : undefined) || omeAttrs?.omero || {},
    coordinateTransformations: attrs.coordinateTransformations || omeAttrs?.coordinateTransformations
  };
}

function inferLabels(
  attrs: ReturnType<typeof normalizeRootAttrs>,
  array: zarrita.Array<zarrita.DataType, Readable>,
  optionLabels?: string[]
): Labels<string[]> {
  const labels =
    optionLabels ||
    normalizeDimensionNames(array.dimensionNames) ||
    getAxisNames(attrs.multiscales?.[0]?.axes) ||
    guessLabels(attrs as RootAttrs);

  if (!validLabels(labels, array.shape)) {
    throw new Error('Invalid labels for OME-Zarr array dimensions.');
  }

  return labels;
}

function normalizeDimensionNames(dimensionNames?: string[]): string[] | null {
  if (!dimensionNames?.length) {
    return null;
  }

  return [...dimensionNames];
}

function getAxisNames(
  axes: Array<string | {name?: string; type?: string}> | undefined
): string[] | null {
  if (!axes?.length) {
    return null;
  }

  const labels = axes
    .map(axis => (typeof axis === 'string' ? axis : axis.name))
    .filter((axisName): axisName is string => Boolean(axisName));

  return labels.length ? labels : null;
}

function normalizeOMEZarrMetadata(
  data: string,
  attrs: ReturnType<typeof normalizeRootAttrs>,
  sources: ZarritaPixelSource<string[]>[]
): OMEZarrSourceLoaderMetadata {
  const baseSource = sources[0];
  const interleaved = isInterleaved(baseSource.shape);
  const [height, width] = baseSource.shape.slice(interleaved ? -3 : -2);
  const labels = [...baseSource.labels];
  const dtype = normalizeDtype(baseSource.dtype);
  const bandCount =
    getAxisSize(baseSource.shape, labels, '_c') ||
    getAxisSize(baseSource.shape, labels, 'c') ||
    (attrs.omero?.channels?.length || 1);
  const levels = sources.map((source, level) => {
    const [levelHeight, levelWidth] = source.shape.slice(isInterleaved(source.shape) ? -3 : -2);
    return {
      level,
      path: attrs.multiscales[0]?.datasets[level]?.path || String(level),
      width: levelWidth,
      height: levelHeight
    };
  });

  return {
    name: attrs.omero?.name || getOMEZarrName(data),
    width,
    height,
    bandCount,
    dtype,
    sizeT: getAxisSize(baseSource.shape, labels, 't') || 1,
    sizeZ: getAxisSize(baseSource.shape, labels, 'z') || 1,
    sizeC:
      getAxisSize(baseSource.shape, labels, 'c') ||
      getAxisSize(baseSource.shape, labels, '_c') ||
      attrs.omero?.channels?.length ||
      1,
    labels,
    tileSize: {width: baseSource.tileSize, height: baseSource.tileSize},
    levels,
    channels: (attrs.omero?.channels || []).map(normalizeChannel),
    metadata: attrs as unknown as Record<string, unknown>,
    coordinateTransformations: attrs.coordinateTransformations
  };
}

function normalizeChannel(channel: Channel, index: number): OMEZarrChannelMetadata {
  return {
    index,
    name: channel.label,
    color: channel.color,
    active: channel.active
  };
}

function getAxisSize(shape: number[], labels: string[], label: string): number | null {
  const index = labels.indexOf(label);
  return index >= 0 ? shape[index] : null;
}

function normalizeDtype(dtype: string): RasterChannelDataType {
  switch (dtype) {
    case 'uint8':
    case 'uint16':
    case 'uint32':
    case 'int8':
    case 'int16':
    case 'int32':
    case 'float32':
    case 'float64':
      return dtype;
    default:
      throw new Error(`OME-Zarr dtype ${dtype} is not currently supported.`);
  }
}

function normalizeChannelSelection(
  requestedChannels: number[] | undefined,
  bandCount: number,
  defaultChannels?: number[]
): number[] {
  const channelSelection =
    requestedChannels || defaultChannels || Array.from({length: bandCount}, (_, index) => index);

  for (const channel of channelSelection) {
    if (channel < 0 || channel >= bandCount) {
      throw new Error(`Channel ${channel} is out of bounds for OME-Zarr with ${bandCount} bands.`);
    }
  }

  return channelSelection;
}

function getOMEZarrName(data: string): string {
  const normalizedData = data.replace(/[?#].*$/, '').replace(/\/+$/, '');
  return normalizedData.split('/').pop() || normalizedData;
}

function interleaveTypedArrays(
  data: SupportedTypedArray[],
  dtype: RasterChannelDataType
): SupportedTypedArray {
  const TypedArrayConstructor = getTypedArrayConstructor(dtype);
  const length = data[0]?.length || 0;
  const channelCount = data.length;
  const interleaved = new TypedArrayConstructor(length * channelCount);

  for (let index = 0; index < length; index++) {
    for (let channelIndex = 0; channelIndex < channelCount; channelIndex++) {
      interleaved[index * channelCount + channelIndex] = data[channelIndex][index];
    }
  }

  return interleaved;
}

function selectInterleavedChannels(
  data: SupportedTypedArray,
  bandCount: number,
  channels: number[],
  interleaved: boolean
): SupportedTypedArray | SupportedTypedArray[] {
  if (channels.length === bandCount && interleaved) {
    return data;
  }

  const TypedArrayConstructor = data.constructor as new (length: number) => SupportedTypedArray;
  const pixelCount = data.length / bandCount;
  const channelData = channels.map(() => new TypedArrayConstructor(pixelCount));

  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex++) {
    for (let channelSelectionIndex = 0; channelSelectionIndex < channels.length; channelSelectionIndex++) {
      channelData[channelSelectionIndex][pixelIndex] =
        data[pixelIndex * bandCount + channels[channelSelectionIndex]];
    }
  }

  if (interleaved) {
    return interleaveTypedArrays(channelData, getTypedArrayDtype(TypedArrayConstructor));
  }

  return channelData.length === 1 ? channelData[0] : channelData;
}

function getTypedArrayConstructor(
  dtype: RasterChannelDataType
): new (length: number) => SupportedTypedArray {
  switch (dtype) {
    case 'uint8':
      return Uint8Array;
    case 'uint16':
      return Uint16Array;
    case 'uint32':
      return Uint32Array;
    case 'int8':
      return Int8Array;
    case 'int16':
      return Int16Array;
    case 'int32':
      return Int32Array;
    case 'float32':
      return Float32Array;
    case 'float64':
      return Float64Array;
    default:
      throw new Error(`Unsupported dtype ${dtype}.`);
  }
}

function getTypedArrayDtype(
  TypedArrayConstructor: new (length: number) => SupportedTypedArray
): RasterChannelDataType {
  switch (TypedArrayConstructor) {
    case Uint8Array:
      return 'uint8';
    case Uint16Array:
      return 'uint16';
    case Uint32Array:
      return 'uint32';
    case Int8Array:
      return 'int8';
    case Int16Array:
      return 'int16';
    case Int32Array:
      return 'int32';
    case Float32Array:
      return 'float32';
    case Float64Array:
      return 'float64';
    default:
      throw new Error('Unsupported TypedArray constructor.');
  }
}
