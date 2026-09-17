// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, SourceLoader} from '@loaders.gl/loader-utils';
import type {ArrowTableVectorTileSource} from './arrow-table-tile-source-loader';
import {
  ARROW_TABLE_TILE_SOURCE_DEFAULT_OPTIONS,
  type ArrowTableTileSourceInput,
  type ArrowTableTileSourceLoaderOptions
} from './arrow-table-tile-source-types';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Loads the Arrow tiler runtime from its explicit package subpath. */
async function preloadArrowTableTileSourceLoader(): Promise<
  SourceLoader<ArrowTableVectorTileSource>
> {
  const {ArrowTableTileSourceLoaderWithParser} = await import(
    '@loaders.gl/mvt/arrow-table-tile-source-loader'
  );
  return ArrowTableTileSourceLoaderWithParser;
}

/** Lightweight Arrow tiler metadata; use async load() or the explicit runtime subpath. */
export const ArrowTableTileSourceLoader = {
  dataType: null as unknown as ArrowTableVectorTileSource,
  batchType: null as never,
  name: 'ArrowTableTiler',
  id: 'arrow-table-tiler',
  module: 'mvt',
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
  createDataSource(
    _input: string | Blob | ArrowTableTileSourceInput | Promise<ArrowTableTileSourceInput>,
    _options: ArrowTableTileSourceLoaderOptions = {},
    _coreApi?: CoreAPI
  ): ArrowTableVectorTileSource {
    throw new Error(
      'ArrowTableTileSourceLoader requires async load() or an explicit @loaders.gl/mvt/arrow-table-tile-source-loader import'
    );
  }
} as const satisfies SourceLoader<ArrowTableVectorTileSource>;
