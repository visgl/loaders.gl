// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {Batch, GeoJSONTable} from '@loaders.gl/schema';
import {SHP_MAGIC_NUMBER} from './shp-loader';
import {parseShapefile, parseShapefileInBatches} from './lib/parsers/parse-shapefile';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type ShapefileLoaderOptions = LoaderOptions & {
  shapefile?: {
    shape?: 'geojson-table' | 'v3';
    /** @deprecated Worker URLs must be specified with .dbf.workerUrl * .shp.workerUrl */
    workerUrl?: never;
  };
};

/**
 * Shapefile loader
 * @note Shapefile is multifile format and requires providing additional files
 */
export const ShapefileLoader = {
  name: 'Shapefile',
  id: 'shapefile',
  module: 'shapefile',
  version: VERSION,
  category: 'geometry',
  extensions: ['shp'],
  mimeTypes: ['application/octet-stream'],
  tests: [new Uint8Array(SHP_MAGIC_NUMBER).buffer],
  options: {
    shapefile: {
      shape: 'v3'
    },
    shp: {
      _maxDimensions: 4
    }
  },
  // @ts-expect-error
  parse: parseShapefile,
  // @ts-expect-error
  parseInBatches: parseShapefileInBatches
} as const satisfies LoaderWithParser<GeoJSONTable, Batch, ShapefileLoaderOptions>;
