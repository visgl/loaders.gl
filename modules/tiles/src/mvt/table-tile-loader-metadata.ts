// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TableVectorTileSource} from './table-tile-loader';

/** Shared descriptor for TableTileLoader. */
export const TableTileLoaderMetadata = {
  dataType: null as unknown as TableVectorTileSource,
  batchType: null as never,
  name: 'TableTiler',
  id: 'table-tiler',
  module: 'tiles',
  version: '0.0.0',
  extensions: ['mvt'] as string[],
  mimeTypes: ['application/octet-stream'] as string[],
  type: 'table',
  fromUrl: true,
  fromBlob: true,

  options: {
    table: {
      coordinates: 'local',
      promoteId: undefined!,
      maxZoom: 14,
      indexMaxZoom: 5,
      maxPointsPerTile: 10000,
      tolerance: 3,
      extent: 4096,
      buffer: 64,
      generateId: undefined,
      shape: 'geojson-table'
    }
  },

  defaultOptions: {
    table: {
      coordinates: 'local',
      promoteId: undefined!,
      maxZoom: 14,
      indexMaxZoom: 5,
      maxPointsPerTile: 10000,
      tolerance: 3,
      extent: 4096,
      buffer: 64,
      generateId: undefined,
      shape: 'geojson-table'
    }
  },

  testURL: (url: string): boolean => url.endsWith('.geojson')
} as const;

/** Loads the TableTileLoader implementation on first use. */
export const TableTileLoader = {
  ...TableTileLoaderMetadata,
  async preload() {
    const implementation = await import('./table-tile-loader.js');
    return implementation.TableTileLoader;
  }
} as const;
