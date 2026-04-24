// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';
import {SHP_MAGIC_NUMBER} from './shp-loader';
import type {ShapefileLoaderOptions} from './shapefile-loader';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for `ShapefileArrowLoader`. */
export type ShapefileArrowLoaderOptions = ShapefileLoaderOptions;

/** Preloads the parser-bearing Shapefile Arrow loader implementation. */
async function preload() {
  const {ShapefileArrowLoaderWithParser} = await import('./shapefile-arrow-loader-with-parser');
  return ShapefileArrowLoaderWithParser;
}

/** Metadata-only Shapefile loader that returns properties and geometry as an Arrow table. */
export const ShapefileArrowLoader = {
  name: 'Shapefile Arrow',
  id: 'shapefile-arrow',
  module: 'shapefile',
  version: VERSION,
  category: 'geometry',
  extensions: ['shp'],
  mimeTypes: ['application/octet-stream'],
  tests: [new Uint8Array(SHP_MAGIC_NUMBER).buffer],
  dataType: null as unknown as ArrowTable,
  batchType: null as unknown as ArrowTableBatch,
  options: {
    shapefile: {
      shape: 'arrow-table'
    },
    shp: {
      _maxDimensions: 4
    }
  },
  preload
} as const satisfies Loader<ArrowTable, ArrowTableBatch, ShapefileArrowLoaderOptions>;
