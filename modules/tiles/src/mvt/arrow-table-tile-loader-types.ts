// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, SourceLoader} from '@loaders.gl/core/loader-utils';
import type {ArrowTableVectorTileSource} from './arrow-table-tile-loader';
import {
  ARROW_TABLE_TILE_SOURCE_DEFAULT_OPTIONS,
  type ArrowTableTileSourceInput,
  type ArrowTableTileLoaderOptions
} from './arrow-table-tile-source-types';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Loads the Arrow tiler runtime from its explicit package subpath. */
async function preloadArrowTableTileSourceLoader(): Promise<
  SourceLoader<ArrowTableVectorTileSource>
> {
  const {ArrowTableTileLoaderWithParser} = await import(
    '@loaders.gl/tiles/arrow-table-tile-loader'
  );
  return ArrowTableTileLoaderWithParser;
}

/** Lightweight Arrow tiler metadata; use async createDataSource() or the explicit runtime subpath. */
export const ArrowTableTileLoader = {
  dataType: null as unknown as ArrowTableVectorTileSource,
  batchType: null as never,
  name: 'ArrowTableTiler',
  id: 'arrow-table-tiler',
  module: 'tiles',
  version: VERSION,
  extensions: [],
  mimeTypes: [],
  type: 'table',
  fromUrl: true,
  fromBlob: true,
  /** Selection is explicit because any Arrow-producing loader can supply the input. */
  testURL: () => false,
  options: ARROW_TABLE_TILE_SOURCE_DEFAULT_OPTIONS,
  defaultOptions: ARROW_TABLE_TILE_SOURCE_DEFAULT_OPTIONS,
  preload: preloadArrowTableTileSourceLoader,
  /** Direct construction requires the runtime loader rather than metadata. */
  createDataSourceSync(
    _input: string | Blob | ArrowTableTileSourceInput | Promise<ArrowTableTileSourceInput>,
    _options: ArrowTableTileLoaderOptions = {},
    _coreApi?: CoreAPI
  ): ArrowTableVectorTileSource {
    throw new Error(
      'ArrowTableTileLoader requires async createDataSource() or an explicit @loaders.gl/tiles/arrow-table-tile-loader import'
    );
  }
} as const satisfies SourceLoader<ArrowTableVectorTileSource>;
