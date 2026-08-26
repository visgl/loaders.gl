// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as zarrita from 'zarrita';
import type {Readable} from 'zarrita';
import type {CoreAPI, SourceLoader, TypedArray} from '@loaders.gl/loader-utils';
import {ZarrSource, type ZarrSourceLoaderOptions} from './ome-zarr-source-loader';
import {getCachedZarrSelection, getZarrSelectionKey} from './lib/zarr-data-cache';

/** Metadata describing one directly addressable Zarr array. */
export type ZarrArraySourceMetadata = {
  /** Array path relative to the selected Zarr group. */
  path: string;
  /** Dimension lengths in storage order. */
  shape: number[];
  /** Native chunk lengths in storage order. */
  chunks: number[];
  /** Zarrita dtype identifier. */
  dtype: string;
  /** Zarr fill value used for uninitialized chunks. */
  fillValue: unknown;
  /** Array-level Zarr attributes. */
  attributes: Record<string, unknown>;
  /** Stable dimension names, supplied by the caller or generated from rank. */
  dimensions: string[];
};

/** Parameters for reading a Zarr array selection. */
export type GetZarrArrayParameters = {
  /** Integer or slice selector for each dimension; null retains that dimension. */
  selection?: ZarrArraySelection;
  /** Named selectors resolved against the metadata dimension labels. */
  selectionByDimension?: Readonly<Record<string, number | null | ZarrArraySlice>>;
  /** Abort signal forwarded to metadata and chunk requests. */
  signal?: AbortSignal;
};

/** Slice selector accepted by {@link ZarrArraySource#getArray}. */
export type ZarrArraySlice = {
  /** Inclusive starting index, defaulting to the dimension boundary. */
  start?: number;
  /** Exclusive stopping index, defaulting to the dimension boundary. */
  stop?: number;
  /** Stride between selected indices, defaulting to one. */
  step?: number;
};

/** Positional selectors for a Zarr array read. */
export type ZarrArraySelection = Array<number | null | ZarrArraySlice>;

/** Result of a Zarr array read. */
export type ZarrArrayData = {
  /** Decoded array values in row-major selection order. */
  data: TypedArray;
  /** Resulting shape after applying integer selections. */
  shape: number[];
};

/** Options for {@link ZarrArraySourceLoader}. */
export type ZarrArraySourceLoaderOptions = ZarrSourceLoaderOptions & {
  /** Array path and optional dimension labels. */
  zarrArray?: {
    /** Array path relative to `zarr.path`, defaulting to the selected root array. */
    path?: string;
    /** Dimension labels in storage order. */
    dimensions?: string[];
  };
};

/** Source loader for direct, non-geospatial Zarr array access. */
export const ZarrArraySourceLoader = {
  dataType: null as unknown as ZarrArraySource,
  dataSource: null as unknown as ZarrArraySource,
  batchType: null as never,
  name: 'ZarrArraySourceLoader',
  id: 'zarr-array',
  module: 'zarr',
  version: 'latest',
  extensions: ['zarr'],
  mimeTypes: [],
  type: 'zarr-array',
  fromUrl: true,
  fromBlob: false,
  options: {
    zarr: {
      metadataPath: 'auto',
      path: null,
      labels: undefined!,
      requireConsolidatedMetadata: true
    },
    zarrArray: {path: undefined!, dimensions: undefined!}
  } as ZarrArraySourceLoaderOptions,
  defaultOptions: {
    zarr: {
      metadataPath: 'auto',
      path: null,
      labels: undefined!,
      requireConsolidatedMetadata: true
    },
    zarrArray: {path: undefined!, dimensions: undefined!}
  },
  testURL: (url: string): boolean => /\.zarr(?:$|[/?#])/i.test(url),
  createDataSource: (
    data: string,
    options: ZarrArraySourceLoaderOptions,
    coreApi?: CoreAPI
  ): ZarrArraySource => new ZarrArraySource(data, options, coreApi)
} as const satisfies SourceLoader<ZarrArraySource>;

/** Runtime source for direct access to a single Zarr array. */
export class ZarrArraySource extends ZarrSource {
  /** Cached array initialization. */
  private initializationPromise: Promise<{
    array: zarrita.Array<zarrita.DataType, Readable>;
    metadata: ZarrArraySourceMetadata;
  }> | null = null;

  /** Opens a Zarr array source. */
  constructor(data: string, options: ZarrArraySourceLoaderOptions, coreApi?: CoreAPI) {
    super(data, options, coreApi);
  }

  /** Returns array shape, chunks, dtype, and dimension labels. */
  async getMetadata(signal?: AbortSignal): Promise<ZarrArraySourceMetadata> {
    return (await this.getInitializationPromise(signal)).metadata;
  }

  /** Reads the selected array values. */
  async getArray(parameters: GetZarrArrayParameters = {}): Promise<ZarrArrayData> {
    const {array, metadata} = await this.getInitializationPromise(parameters.signal);
    if (parameters.selection && parameters.selectionByDimension) {
      throw new Error('Zarr array requests cannot combine positional and named selections.');
    }
    const selection = parameters.selection || createNamedSelection(parameters.selectionByDimension, metadata);
    if (selection.length !== metadata.shape.length) {
      throw new Error(`Zarr array selection must have ${metadata.shape.length} dimensions.`);
    }
    const zarritaSelection = selection.map(selector =>
      isZarrArraySlice(selector)
        ? zarrita.slice(selector.start ?? null, selector.stop ?? null, selector.step ?? null)
        : selector
    );
    const chunk = await getCachedZarrSelection(array, getZarrSelectionKey(selection), () =>
      zarrita.get(array, zarritaSelection, {signal: parameters.signal}) as Promise<{
        data: TypedArray;
        shape: number[];
      }>
    );
    if (!chunk || typeof chunk !== 'object' || !('data' in chunk) || !('shape' in chunk)) {
      throw new Error('Failed to read Zarr array selection.');
    }
    return {data: chunk.data as TypedArray, shape: [...chunk.shape]};
  }

  /** Opens the configured array and resolves its normalized metadata. */
  private async getInitializationPromise(signal?: AbortSignal) {
    if (!this.initializationPromise) {
      this.initializationPromise = this.initialize(signal);
    }
    const initializationPromise = this.initializationPromise;
    try {
      return await initializationPromise;
    } catch (error) {
      if (this.initializationPromise === initializationPromise) {
        this.initializationPromise = null;
      }
      throw error;
    }
  }

  /** Opens the array selected by the source options. */
  private async initialize(signal?: AbortSignal) {
    const group = await this.openGroup(signal);
    const options = (this.options as ZarrArraySourceLoaderOptions).zarrArray;
    const path = options?.path || '';
    const location = path ? group.resolve(path) : group;
    const array = await zarrita.open(location, {kind: 'array', signal});
    const dimensions = options?.dimensions || this.options.zarr?.labels ||
      array.shape.map((_size, index) => `dim_${index}`);
    if (dimensions.length !== array.shape.length) {
      throw new Error(`Zarr array dimensions must have length ${array.shape.length}.`);
    }
    return {
      array,
      metadata: {
        path,
        shape: [...array.shape],
        chunks: [...array.chunks],
        dtype: String(array.dtype),
        fillValue: array.fillValue,
        attributes: {...array.attrs},
        dimensions: [...dimensions]
      }
    };
  }
}

/** Converts named dimension selectors into the positional form accepted by Zarrita. */
function createNamedSelection(
  selectionByDimension: GetZarrArrayParameters['selectionByDimension'],
  metadata: ZarrArraySourceMetadata
): ZarrArraySelection {
  const selection = metadata.shape.map(() => null) as ZarrArraySelection;
  for (const [dimension, selector] of Object.entries(selectionByDimension || {})) {
    const dimensionIndex = metadata.dimensions.indexOf(dimension);
    if (dimensionIndex < 0) {
      throw new Error(`Unknown Zarr array dimension ${dimension}.`);
    }
    selection[dimensionIndex] = selector;
  }
  return selection;
}

/** Tests whether a selector is a slice descriptor rather than an index. */
function isZarrArraySlice(selector: number | null | ZarrArraySlice): selector is ZarrArraySlice {
  return typeof selector === 'object' && selector !== null;
}
