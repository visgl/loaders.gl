// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as zarrita from 'zarrita';
import type {Readable} from 'zarrita';
import type {
  CoreAPI,
  SourceLoader,
  DataSourceOptions,
  RasterData,
  RasterChannelDataType,
  RasterQueryCapabilities
} from '@loaders.gl/loader-utils';
import {
  createScanQueryMetadata,
  DataSource,
  type ScanQueryMetadata,
  type ScanQueryMetadataOptions,
  type ScanQueryMetadataProvider
} from '@loaders.gl/loader-utils';

import type {Labels, Channel, Multiscale, RootAttrs, SupportedTypedArray} from './types';
import {guessLabels, guessTileSize, validLabels} from './lib/utils';
import ZarritaPixelSource from './lib/zarrita-pixel-source';
import {
  loadConsolidatedMetadata,
  type LoadConsolidatedMetadataOptions,
  type ZarrConsolidatedMetadata,
  type ZarrMetadataPath
} from './lib/consolidated-zarr';
export type {
  LoadConsolidatedMetadataOptions,
  ZarrConsolidatedFormat,
  ZarrConsolidatedMetadata,
  ZarrMetadataPath
} from './lib/consolidated-zarr';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options shared by Zarr-backed source loaders. */
export type ZarrSourceLoaderOptions = DataSourceOptions & {
  /** Zarr store discovery and dimension options. */
  zarr?: {
    /** Consolidated metadata file to load, or `auto` to probe known names. */
    metadataPath?: ZarrMetadataPath;
    /** Group path within the store root. */
    path?: string | null;
    /** Explicit dimension labels when array or OME metadata does not provide them. */
    labels?: string[];
    /** Whether opening a source requires consolidated metadata. Defaults to `true`. */
    requireConsolidatedMetadata?: boolean;
  };
  /** OME-Zarr raster layout and channel defaults. */
  omezarr?: {
    /** Whether multi-channel reads return one interleaved typed array by default. */
    interleaved?: boolean;
    /** Channel indices selected when a raster request omits `channels`. */
    defaultChannels?: number[];
  };
};

/** Source loader type for Zarr-backed runtime sources. */
export type ZarrSourceLoader<SourceT extends ZarrSource = ZarrSource> = SourceLoader<
  SourceT,
  ZarrSourceLoaderOptions
>;

/** Parameters used to request a 2D OME-Zarr plane. */
export type GetOMEZarrParameters = {
  /** Zero-based pyramid level, or `auto` to select from the requested dimensions. */
  level?: number | 'auto';
  /** Target display width used by automatic level selection. */
  width?: number;
  /** Target display height used by automatic level selection. */
  height?: number;
  /** Zero-based time index. Defaults to the OME display setting or `0`. */
  t?: number;
  /** Zero-based z index. Defaults to the OME display setting or `0`. */
  z?: number;
  /** Zero-based channel indices to load. */
  channels?: number[];
  /** Whether to return one interleaved typed array. */
  interleaved?: boolean;
  /** Abort signal forwarded to metadata and chunk requests. */
  signal?: AbortSignal;
};

/** Channel display metadata exposed by an OME-Zarr source. */
export type OMEZarrChannelMetadata = {
  /** Zero-based channel index. */
  index: number;
  /** Optional OME channel label. */
  name?: string;
  /** Optional OME hexadecimal display color. */
  color?: string;
  /** Whether the channel is active in the OME display settings. */
  active?: boolean;
};

/** Pyramid level metadata exposed by an OME-Zarr source. */
export type OMEZarrLevelMetadata = {
  /** Zero-based pyramid level. */
  level: number;
  /** Dataset path relative to the selected image group. */
  path: string;
  /** Width of the level in pixels. */
  width: number;
  /** Height of the level in pixels. */
  height: number;
  /** OME coordinate transformations declared for this level. */
  coordinateTransformations?: unknown[];
  /** Scale relative to the full-resolution level. */
  scale?: [number, number];
};

/** Normalized metadata exposed by {@link OMEZarrImageSource}. */
export type OMEZarrSourceLoaderMetadata = {
  /** OME image name, or a name derived from the selected group path. */
  name?: string;
  /** Full-resolution width in pixels. */
  width: number;
  /** Full-resolution height in pixels. */
  height: number;
  /** Number of available channels. */
  bandCount: number;
  /** Numeric channel type. */
  dtype: RasterChannelDataType;
  /** Number of time indices. */
  sizeT: number;
  /** Number of z indices. */
  sizeZ: number;
  /** Number of channel indices. */
  sizeC: number;
  /** Default time index from OME display settings. */
  defaultT: number;
  /** Default z index from OME display settings. */
  defaultZ: number;
  /** Dimension labels reported by the array or OME metadata. */
  labels: string[];
  /** Native chunk dimensions for the full-resolution level. */
  tileSize?: {width: number; height: number};
  /** Available pyramid levels. */
  levels: OMEZarrLevelMetadata[];
  /** OME channel display metadata. */
  channels: OMEZarrChannelMetadata[];
  /** Normalized OME attributes retained for application-specific use. */
  metadata: Record<string, unknown>;
  /** Image-level coordinate transformations when present. */
  coordinateTransformations?: unknown[];
};

/** Options for {@link loadZarrConsolidatedMetadata}. */
export type LoadZarrConsolidatedMetadataOptions = LoadConsolidatedMetadataOptions & {
  /** Fetch implementation used for metadata requests. Defaults to global `fetch`. */
  fetch?: (url: string, options?: RequestInit) => Promise<Response>;
};

type OMEZarrInit = {
  /** Pixel sources ordered by pyramid level. */
  data: ZarritaPixelSource<string[]>[];
  /** Normalized metadata shared by all reads. */
  metadata: OMEZarrSourceLoaderMetadata;
};

/**
 * Loads consolidated metadata for a Zarr store root and extracts top-level arrays and groups.
 */
export async function loadZarrConsolidatedMetadata(
  url: string,
  options: LoadZarrConsolidatedMetadataOptions = {}
): Promise<ZarrConsolidatedMetadata> {
  const fetcher = options.fetch || fetch;
  return await loadConsolidatedMetadata(url, fetcher, options);
}

/**
 * Base runtime source for Zarr-backed sources that resolve groups and consolidated metadata.
 */
export abstract class ZarrSource extends DataSource<string, ZarrSourceLoaderOptions> {
  /** Common raster-query capabilities shared by Zarr-backed sources. */
  readonly rasterQueryCapabilities: RasterQueryCapabilities = Object.freeze({
    bounds: 'pushdown',
    level: 'pushdown',
    variables: 'pushdown',
    slices: 'pushdown',
    streaming: false,
    cancellation: true
  });
  /** Zarrita store used for metadata and chunk reads. */
  protected readonly store: zarrita.FetchStore;
  /** Selected group path within the store root. */
  protected readonly path: string | null;
  /** Shared consolidated metadata request. */
  private consolidatedMetadataPromise: Promise<ZarrConsolidatedMetadata> | null = null;

  /** Creates a Zarr-backed source. */
  constructor(data: string, options: ZarrSourceLoaderOptions, coreApi?: CoreAPI) {
    super(
      data,
      options,
      {
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
      coreApi
    );

    this.path = this.options.zarr?.path || null;
    this.store = new zarrita.FetchStore(getZarritaStoreUrl(this.url), {
      fetch: async (request: Request) => {
        const headers = Object.fromEntries(request.headers.entries());
        return await this.fetchZarrFile(request.url, {
          method: request.method,
          headers,
          signal: request.signal
        });
      }
    });
  }

  /** Returns raster-query capabilities without reading array chunks. */
  getRasterQueryCapabilities(): RasterQueryCapabilities {
    return this.rasterQueryCapabilities;
  }

  /** Fetches Zarr metadata or chunk data through the injected core API when available. */
  private async fetchZarrFile(url: string, requestOptions?: RequestInit): Promise<Response> {
    const fetchUrl = getFetchableUrl(url);
    const response = this.hasCoreApi
      ? await this.coreApi.fetchFile(fetchUrl, requestOptions)
      : await this.fetch(fetchUrl, requestOptions);

    // The Node file fetcher reports missing files as 400/ENOENT, while FetchStore
    // needs a 404 response to continue its v2/v3 format probing.
    if (response.status === 400 && response.statusText.includes('ENOENT')) {
      return new Response(null, {status: 404, statusText: 'Not Found'});
    }
    return response;
  }

  /** Loads normalized consolidated metadata for the backing Zarr store. */
  async getConsolidatedMetadata(signal?: AbortSignal): Promise<ZarrConsolidatedMetadata> {
    if (!this.consolidatedMetadataPromise) {
      this.consolidatedMetadataPromise = loadConsolidatedMetadata(
        this.url,
        (url, requestOptions) => this.fetchZarrFile(url, requestOptions),
        {
          metadataPath: this.options.zarr?.metadataPath,
          signal
        }
      );
    }

    const consolidatedMetadataPromise = this.consolidatedMetadataPromise;
    try {
      return await consolidatedMetadataPromise;
    } catch (error) {
      if (this.consolidatedMetadataPromise === consolidatedMetadataPromise) {
        this.consolidatedMetadataPromise = null;
      }
      throw error;
    }
  }

  /** Opens the selected Zarr group after the configured metadata preflight. */
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
  /** Runtime source type marker used by `createDataSource()` type inference. */
  dataSource: null as unknown as OMEZarrImageSource,
  batchType: null as never,
  name: 'OMEZarrSourceLoader',
  id: 'omezarr',
  module: 'zarr',
  version: VERSION,
  extensions: ['zarr'],
  mimeTypes: [],
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
  } as ZarrSourceLoaderOptions,

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
    options: ZarrSourceLoaderOptions,
    coreApi?: CoreAPI
  ): OMEZarrImageSource => new OMEZarrImageSource(data, options, coreApi)
} as const satisfies ZarrSourceLoader<OMEZarrImageSource>;

/**
 * Source that loads 2D planes from an OME-Zarr pyramid.
 */
export class OMEZarrImageSource extends ZarrSource implements ScanQueryMetadataProvider {
  /** Shared source initialization request. */
  private initPromise: Promise<OMEZarrInit> | null = null;

  /** Returns normalized OME-Zarr image and pyramid metadata. */
  async getMetadata(signal?: AbortSignal): Promise<OMEZarrSourceLoaderMetadata> {
    const {metadata} = await this.getInitPromise(signal);
    return metadata;
  }

  /** Discovers the raster pyramid through the common scan metadata contract. */
  async getQueryMetadata(options: ScanQueryMetadataOptions = {}): Promise<ScanQueryMetadata> {
    const metadata = await this.getMetadata(options.signal);
    return createScanQueryMetadata({
      sourceType: 'omezarr',
      queryType: 'raster',
      name: metadata.name,
      description: 'OME-Zarr multiscale image',
      schema: {fields: [], metadata: {}},
      capabilities: {
        levelOfDetail: metadata.levels.length > 1 ? 'pushdown' : 'unsupported'
      },
      levels: metadata.levels.map(level => ({
        index: level.level,
        width: level.width,
        height: level.height,
        scale: level.scale
      }))
    });
  }

  /** Loads one 2D OME-Zarr plane or channel composite. */
  async getRaster(parameters: GetOMEZarrParameters = {}): Promise<RasterData> {
    const {data, metadata} = await this.getInitPromise(parameters.signal);
    const level = selectOMEZarrLevel(metadata.levels, parameters);
    const pixelSource = data[level];

    if (!pixelSource) {
      throw new Error(`OME-Zarr pyramid level ${level} is not available.`);
    }

    const interleavedSource = metadata.labels.includes('_c');
    const interleaved = parameters.interleaved ?? this.options.omezarr?.interleaved ?? interleavedSource;
    const selection: Record<string, number> = {};
    const timeIndex = normalizeAxisSelection(
      parameters.t,
      metadata.defaultT,
      metadata.sizeT,
      'time'
    );
    const zIndex = normalizeAxisSelection(parameters.z, metadata.defaultZ, metadata.sizeZ, 'z');
    if (metadata.labels.includes('t')) {
      selection.t = timeIndex;
    }
    if (metadata.labels.includes('z')) {
      selection.z = zIndex;
    }
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

  /** Returns the shared initialization request for this source. */
  private async getInitPromise(signal?: AbortSignal): Promise<OMEZarrInit> {
    if (!this.initPromise) {
      this.initPromise = this.initialize(signal);
    }

    const initPromise = this.initPromise;
    try {
      return await initPromise;
    } catch (error) {
      if (this.initPromise === initPromise) {
        this.initPromise = null;
      }
      throw error;
    }
  }

  /** Opens the image group and creates one pixel source per pyramid level. */
  private async initialize(signal?: AbortSignal): Promise<OMEZarrInit> {
    const group = await this.openGroup(signal);
    const attrs = normalizeRootAttrs(group.attrs as unknown as RootAttrs);
    const datasets = attrs.multiscales?.[0]?.datasets;

    if (!datasets?.length) {
      throw new Error('OMEZarrImageSource requires multiscales metadata on the selected group.');
    }

    const arrays = await Promise.all(
      datasets.map(dataset =>
        zarrita.open(group.resolve(dataset.path), {kind: 'array', signal})
      )
    );

    const labels = inferLabels(attrs, arrays[0], this.options.zarr?.labels);
    const tileSize = guessTileSize({shape: arrays[0].shape, chunks: arrays[0].chunks}, labels);
    const data = arrays.map(array => new ZarritaPixelSource(array, labels, tileSize));

    return {
      data,
      metadata: normalizeOMEZarrMetadata(this.path || this.data, attrs, data)
    };
  }
}

/** Normalizes pre-0.5 and 0.5 OME attributes into one internal shape. */
function normalizeRootAttrs(attrs: RootAttrs): {
  multiscales: Multiscale[];
  omero: {channels?: Channel[]; name?: string; rdefs?: {defaultT?: number; defaultZ?: number; model: string}};
  coordinateTransformations?: unknown[];
} {
  const omeAttrs = 'ome' in attrs && attrs.ome ? attrs.ome : null;
  const multiscales =
    ('multiscales' in attrs ? attrs.multiscales : undefined) || omeAttrs?.multiscales || [];
  const legacyCoordinateTransformations =
    'coordinateTransformations' in attrs ? attrs.coordinateTransformations : undefined;

  return {
    multiscales,
    omero: ('omero' in attrs ? attrs.omero : undefined) || omeAttrs?.omero || {},
    coordinateTransformations:
      multiscales[0]?.coordinateTransformations ||
      legacyCoordinateTransformations ||
      omeAttrs?.coordinateTransformations
  };
}

/** Resolves dimension labels from explicit options, array metadata, or OME axes. */
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

/** Copies non-empty Zarr v3 dimension names. */
function normalizeDimensionNames(dimensionNames?: string[]): string[] | null {
  if (!dimensionNames?.length) {
    return null;
  }

  return [...dimensionNames];
}

/** Extracts named dimensions from OME multiscale axis metadata. */
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

/** Builds normalized OME-Zarr metadata from the opened pyramid sources. */
function normalizeOMEZarrMetadata(
  data: string,
  attrs: ReturnType<typeof normalizeRootAttrs>,
  sources: ZarritaPixelSource<string[]>[]
): OMEZarrSourceLoaderMetadata {
  const baseSource = sources[0];
  const interleaved = baseSource.labels[baseSource.labels.length - 1] === '_c';
  const [height, width] = baseSource.shape.slice(interleaved ? -3 : -2);
  const labels = [...baseSource.labels];
  const dtype = normalizeDtype(baseSource.dtype);
  const bandCount =
    getAxisSize(baseSource.shape, labels, '_c') ||
    getAxisSize(baseSource.shape, labels, 'c') ||
    (attrs.omero?.channels?.length || 1);
  const levels = sources.map((source, level) => {
    const levelInterleaved = source.labels[source.labels.length - 1] === '_c';
    const [levelHeight, levelWidth] = source.shape.slice(levelInterleaved ? -3 : -2);
    const dataset = attrs.multiscales[0]?.datasets[level];
    return {
      level,
      path: dataset?.path || String(level),
      width: levelWidth,
      height: levelHeight,
      coordinateTransformations: dataset?.coordinateTransformations,
      scale: [width / levelWidth, height / levelHeight] as [number, number]
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
    defaultT: attrs.omero?.rdefs?.defaultT ?? 0,
    defaultZ: attrs.omero?.rdefs?.defaultZ ?? 0,
    labels,
    tileSize: {width: baseSource.tileWidth, height: baseSource.tileHeight},
    levels,
    channels: (attrs.omero?.channels || []).map(normalizeChannel),
    metadata: attrs as unknown as Record<string, unknown>,
    coordinateTransformations: attrs.coordinateTransformations
  };
}

/** Selects an explicit level or the closest pyramid level for a target viewport. */
function selectOMEZarrLevel(
  levels: OMEZarrLevelMetadata[],
  parameters: GetOMEZarrParameters
): number {
  if (typeof parameters.level === 'number') {
    return parameters.level;
  }
  if (parameters.level !== 'auto' || !parameters.width || !parameters.height) {
    return 0;
  }
  const suitable = levels
    .filter(level => level.width >= parameters.width! && level.height >= parameters.height!)
    .sort((first, second) => first.width * first.height - second.width * second.height);
  return (suitable[0] || levels[0]).level;
}

/** Converts OME display settings for one channel into public metadata. */
function normalizeChannel(channel: Channel, index: number): OMEZarrChannelMetadata {
  return {
    index,
    name: channel.label,
    color: channel.color,
    active: channel.active
  };
}

/** Returns the size of a named dimension when it is present. */
function getAxisSize(shape: number[], labels: string[], label: string): number | null {
  const index = labels.indexOf(label);
  return index >= 0 ? shape[index] : null;
}

/** Converts a Zarrita dtype into the raster source dtype union. */
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

/** Resolves and validates the channel selection for a raster request. */
function normalizeChannelSelection(
  requestedChannels: number[] | undefined,
  bandCount: number,
  defaultChannels?: number[]
): number[] {
  const channelSelection =
    requestedChannels || defaultChannels || Array.from({length: bandCount}, (_, index) => index);

  if (channelSelection.length === 0) {
    throw new Error('OME-Zarr channel selection must include at least one channel.');
  }

  for (const channel of channelSelection) {
    if (!Number.isInteger(channel) || channel < 0 || channel >= bandCount) {
      throw new Error(`Channel ${channel} is out of bounds for OME-Zarr with ${bandCount} bands.`);
    }
  }

  return [...channelSelection];
}

/** Resolves and validates one optional time or z selection. */
function normalizeAxisSelection(
  requestedIndex: number | undefined,
  defaultIndex: number,
  size: number,
  axisName: 'time' | 'z'
): number {
  const index = requestedIndex ?? defaultIndex;
  if (!Number.isInteger(index) || index < 0 || index >= size) {
    throw new Error(`OME-Zarr ${axisName} index ${index} is out of bounds for axis size ${size}.`);
  }
  return index;
}

/** Derives a display name from a store URL or selected group path. */
function getOMEZarrName(data: string): string {
  const normalizedData = data.replace(/[?#].*$/, '').replace(/\/+$/, '');
  return normalizedData.split('/').pop() || normalizedData;
}

/** Converts file URLs emitted by FetchStore into paths accepted by core's Node file fetcher. */
function getFetchableUrl(url: string): string {
  if (!url.startsWith('file:')) {
    return url;
  }

  return decodeURIComponent(new URL(url).pathname);
}

/** Resolves browser-relative URLs because Zarrita's FetchStore requires an absolute URL. */
function getZarritaStoreUrl(url: string): string {
  if (typeof globalThis.location?.href !== 'string') {
    return url;
  }

  return new URL(url, globalThis.location.href).href;
}

/** Interleaves equally sized planar channel arrays. */
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

/** Selects channels from an interleaved source and returns the requested layout. */
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

/** Returns the typed-array constructor for a raster dtype. */
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

/** Returns the raster dtype represented by a typed-array constructor. */
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
