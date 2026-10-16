// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, SourceLoader} from '@loaders.gl/loader-utils';
import type {GeoZarrRasterSource, GeoZarrSourceLoaderOptions} from './geo-zarr-source-loader';
import type {OMEZarrImageSource, ZarrSourceLoaderOptions} from './ome-zarr-source-loader';
import type {SpatialDataSource, SpatialDataSourceLoaderOptions} from './spatial-data-source';
import type {ZarrArraySource, ZarrArraySourceLoaderOptions} from './zarr-array-source';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Metadata-only OME-Zarr loader. */
export const OMEZarrSourceLoader = {
  dataType: null as unknown as OMEZarrImageSource,
  batchType: null as never,
  name: 'OMEZarrSourceLoader',
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
  } as ZarrSourceLoaderOptions,
  defaultOptions: {
    zarr: {metadataPath: 'auto', path: null, labels: undefined!, requireConsolidatedMetadata: true},
    omezarr: {interleaved: false, defaultChannels: undefined!}
  },
  testURL: (url: string): boolean => /\.zarr(?:$|[/?#])/i.test(url),
  preload: async () => (await import('@loaders.gl/scientific/zarr/ome-zarr-source-loader')).OMEZarrSourceLoaderWithParser,
  createDataSource(_data: string, _options: ZarrSourceLoaderOptions, _coreApi?: CoreAPI): OMEZarrImageSource {
    throw new Error('OMEZarrSourceLoader requires async load() or an explicit @loaders.gl/scientific/zarr/ome-zarr-source-loader import');
  }
} as const satisfies SourceLoader<OMEZarrImageSource>;

/** Metadata-only GeoZarr loader. */
export const GeoZarrSourceLoader = {
  dataType: null as unknown as GeoZarrRasterSource,
  batchType: null as never,
  name: 'GeoZarrSourceLoader',
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
    geozarr: {array: undefined!, spatialDimensions: undefined!, transform: undefined!, coordinateReferenceSystem: undefined!, defaultSelection: undefined!}
  } as GeoZarrSourceLoaderOptions,
  defaultOptions: {
    zarr: {metadataPath: 'auto', path: null, labels: undefined!, requireConsolidatedMetadata: true},
    geozarr: {array: undefined!, spatialDimensions: undefined!, transform: undefined!, coordinateReferenceSystem: undefined!, defaultSelection: undefined!}
  },
  testURL: (url: string): boolean => /\.zarr(?:$|[/?#])/i.test(url),
  preload: async () => (await import('@loaders.gl/scientific/zarr/geo-zarr-source-loader')).GeoZarrSourceLoaderWithParser,
  createDataSource(_data: string, _options: GeoZarrSourceLoaderOptions, _coreApi?: CoreAPI): GeoZarrRasterSource {
    throw new Error('GeoZarrSourceLoader requires async load() or an explicit @loaders.gl/scientific/zarr/geo-zarr-source-loader import');
  }
} as const satisfies SourceLoader<GeoZarrRasterSource>;

/** Metadata-only direct Zarr array loader. */
export const ZarrArraySourceLoader = {
  dataType: null as unknown as ZarrArraySource,
  batchType: null as never,
  name: 'ZarrArraySourceLoader',
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
  } as ZarrArraySourceLoaderOptions,
  defaultOptions: {
    zarr: {metadataPath: 'auto', path: null, labels: undefined!, requireConsolidatedMetadata: true},
    zarrArray: {path: undefined!, dimensions: undefined!}
  },
  testURL: (url: string): boolean => /\.zarr(?:$|[/?#])/i.test(url),
  preload: async () => (await import('@loaders.gl/scientific/zarr/zarr-array-source')).ZarrArraySourceLoaderWithParser,
  createDataSource(_data: string, _options: ZarrArraySourceLoaderOptions, _coreApi?: CoreAPI): ZarrArraySource {
    throw new Error('ZarrArraySourceLoader requires async load() or an explicit @loaders.gl/scientific/zarr/zarr-array-source import');
  }
} as const satisfies SourceLoader<ZarrArraySource>;

/** Metadata-only SpatialData loader. */
export const SpatialDataSourceLoader = {
  dataType: null as unknown as SpatialDataSource,
  batchType: null as never,
  name: 'SpatialDataSourceLoader',
  id: 'spatial-data',
  module: 'scientific',
  version: VERSION,
  extensions: ['zarr'],
  mimeTypes: [],
  type: 'spatial-data',
  fromUrl: true,
  fromBlob: false,
  options: {zarr: {metadataPath: 'auto', path: null, labels: undefined!, requireConsolidatedMetadata: true}} as SpatialDataSourceLoaderOptions,
  defaultOptions: {zarr: {metadataPath: 'auto', path: null, labels: undefined!, requireConsolidatedMetadata: true}},
  testURL: (url: string): boolean => /\.zarr(?:$|[/?#])/i.test(url),
  preload: async () => (await import('@loaders.gl/scientific/zarr/spatial-data-source')).SpatialDataSourceLoaderWithParser,
  createDataSource(_data: string, _options: SpatialDataSourceLoaderOptions, _coreApi?: CoreAPI): SpatialDataSource {
    throw new Error('SpatialDataSourceLoader requires async load() or an explicit @loaders.gl/scientific/zarr/spatial-data-source import');
  }
} as const satisfies SourceLoader<SpatialDataSource>;
