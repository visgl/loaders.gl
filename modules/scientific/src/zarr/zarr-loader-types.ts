// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, SourceLoader} from '@loaders.gl/core/loader-utils';
import type {GeoZarrRasterSource, GeoZarrLoaderOptions} from './geo-zarr-loader';
import type {OMEZarrImageSource, ZarrLoaderOptions} from './ome-zarr-loader';
import type {SpatialDataSource, SpatialDataLoaderOptions} from './spatial-data-loader';
import type {ZarrArraySource, ZarrArrayLoaderOptions} from './zarr-array-loader';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Metadata-only OME-Zarr loader. */
export const OMEZarrLoader = {
  dataType: null as unknown as OMEZarrImageSource,
  batchType: null as never,
  name: 'OMEZarrLoader',
  id: 'omezarr',
  module: 'scientific',
  version: VERSION,
  extensions: ['zarr'],
  mimeTypes: [],
  type: 'omezarr',
  fromUrl: true,
  fromBlob: false,
  options: {
    zarr: {metadataPath: 'auto', path: null, labels: undefined!, requireConsolidatedMetadata: true},
    omezarr: {interleaved: false, defaultChannels: undefined!}
  } as ZarrLoaderOptions,
  defaultOptions: {
    zarr: {metadataPath: 'auto', path: null, labels: undefined!, requireConsolidatedMetadata: true},
    omezarr: {interleaved: false, defaultChannels: undefined!}
  },
  testURL: (url: string): boolean => /\.zarr(?:$|[/?#])/i.test(url),
  preload: async () =>
    (await import('@loaders.gl/scientific/zarr/ome-zarr-loader'))
      .OMEZarrLoaderWithParser,
  createDataSourceSync(
    _data: string,
    _options: ZarrLoaderOptions,
    _coreApi?: CoreAPI
  ): OMEZarrImageSource {
    throw new Error(
      'OMEZarrLoader requires async createDataSource() or an explicit @loaders.gl/scientific/zarr/ome-zarr-loader import'
    );
  }
} as const satisfies SourceLoader<OMEZarrImageSource>;

/** Metadata-only GeoZarr loader. */
export const GeoZarrLoader = {
  dataType: null as unknown as GeoZarrRasterSource,
  batchType: null as never,
  name: 'GeoZarrLoader',
  id: 'geozarr',
  module: 'scientific',
  version: VERSION,
  extensions: ['zarr'],
  mimeTypes: [],
  type: 'geozarr',
  fromUrl: true,
  fromBlob: false,
  options: {
    zarr: {metadataPath: 'auto', path: null, labels: undefined!, requireConsolidatedMetadata: true},
    geozarr: {
      array: undefined!,
      spatialDimensions: undefined!,
      transform: undefined!,
      coordinateReferenceSystem: undefined!,
      defaultSelection: undefined!
    }
  } as GeoZarrLoaderOptions,
  defaultOptions: {
    zarr: {metadataPath: 'auto', path: null, labels: undefined!, requireConsolidatedMetadata: true},
    geozarr: {
      array: undefined!,
      spatialDimensions: undefined!,
      transform: undefined!,
      coordinateReferenceSystem: undefined!,
      defaultSelection: undefined!
    }
  },
  testURL: (url: string): boolean => /\.zarr(?:$|[/?#])/i.test(url),
  preload: async () =>
    (await import('@loaders.gl/scientific/zarr/geo-zarr-loader'))
      .GeoZarrLoaderWithParser,
  createDataSourceSync(
    _data: string,
    _options: GeoZarrLoaderOptions,
    _coreApi?: CoreAPI
  ): GeoZarrRasterSource {
    throw new Error(
      'GeoZarrLoader requires async createDataSource() or an explicit @loaders.gl/scientific/zarr/geo-zarr-loader import'
    );
  }
} as const satisfies SourceLoader<GeoZarrRasterSource>;

/** Metadata-only direct Zarr array loader. */
export const ZarrArrayLoader = {
  dataType: null as unknown as ZarrArraySource,
  batchType: null as never,
  name: 'ZarrArrayLoader',
  id: 'zarr-array',
  module: 'scientific',
  version: VERSION,
  extensions: ['zarr'],
  mimeTypes: [],
  type: 'zarr-array',
  fromUrl: true,
  fromBlob: false,
  options: {
    zarr: {metadataPath: 'auto', path: null, labels: undefined!, requireConsolidatedMetadata: true},
    zarrArray: {path: undefined!, dimensions: undefined!}
  } as ZarrArrayLoaderOptions,
  defaultOptions: {
    zarr: {metadataPath: 'auto', path: null, labels: undefined!, requireConsolidatedMetadata: true},
    zarrArray: {path: undefined!, dimensions: undefined!}
  },
  testURL: (url: string): boolean => /\.zarr(?:$|[/?#])/i.test(url),
  preload: async () =>
    (await import('@loaders.gl/scientific/zarr/zarr-array-loader')).ZarrArrayLoaderWithParser,
  createDataSourceSync(
    _data: string,
    _options: ZarrArrayLoaderOptions,
    _coreApi?: CoreAPI
  ): ZarrArraySource {
    throw new Error(
      'ZarrArrayLoader requires async createDataSource() or an explicit @loaders.gl/scientific/zarr/zarr-array-loader import'
    );
  }
} as const satisfies SourceLoader<ZarrArraySource>;

/** Metadata-only SpatialData loader. */
export const SpatialDataLoader = {
  dataType: null as unknown as SpatialDataSource,
  batchType: null as never,
  name: 'SpatialDataLoader',
  id: 'spatial-data',
  module: 'scientific',
  version: VERSION,
  extensions: ['zarr'],
  mimeTypes: [],
  type: 'spatial-data',
  fromUrl: true,
  fromBlob: false,
  options: {
    zarr: {metadataPath: 'auto', path: null, labels: undefined!, requireConsolidatedMetadata: true}
  } as SpatialDataLoaderOptions,
  defaultOptions: {
    zarr: {metadataPath: 'auto', path: null, labels: undefined!, requireConsolidatedMetadata: true}
  },
  testURL: (url: string): boolean => /\.zarr(?:$|[/?#])/i.test(url),
  preload: async () =>
    (await import('@loaders.gl/scientific/zarr/spatial-data-loader'))
      .SpatialDataLoaderWithParser,
  createDataSourceSync(
    _data: string,
    _options: SpatialDataLoaderOptions,
    _coreApi?: CoreAPI
  ): SpatialDataSource {
    throw new Error(
      'SpatialDataLoader requires async createDataSource() or an explicit @loaders.gl/scientific/zarr/spatial-data-loader import'
    );
  }
} as const satisfies SourceLoader<SpatialDataSource>;
