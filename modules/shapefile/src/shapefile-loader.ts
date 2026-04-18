// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {StrictLoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {Batch, GeoJSONTable, ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';
import {SHP_MAGIC_NUMBER, SHPLoaderOptions} from './shp-loader';
import {
  parseShapefile,
  parseShapefileInBatches,
  type ShapefileOutput
} from './lib/parsers/parse-shapefile';
import {DBFLoaderOptions} from './dbf-loader';
import {parseShapefileToArrow, parseShapefileToArrowInBatches} from './shapefile-arrow-loader';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type ShapefileLoaderOptions = StrictLoaderOptions &
  SHPLoaderOptions &
  DBFLoaderOptions & {
    shapefile?: {
      shape?: 'geojson-table' | 'arrow-table' | 'v3';
      /** @deprecated Worker URLs must be specified with .dbf.workerUrl * .shp.workerUrl */
      workerUrl?: never;
    };
    gis?: {
      reproject?: boolean;
      _targetCrs?: string;
    };
  };

/**
 * Shapefile loader
 * @note Shapefile is multifile format and requires providing additional files
 */
export const ShapefileLoader = {
  dataType: null as unknown as ShapefileOutput | GeoJSONTable | ArrowTable,
  batchType: null as unknown as ShapefileOutput | Batch | ArrowTableBatch,
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
  parse: (arrayBuffer, options, context) =>
    options?.shapefile?.shape === 'arrow-table'
      ? parseShapefileToArrow(arrayBuffer, options, context)
      : parseShapefile(arrayBuffer, options, context),
  parseInBatches: (asyncIterator, options, context) =>
    options?.shapefile?.shape === 'arrow-table'
      ? parseShapefileToArrowInBatches(asyncIterator, options, context)
      : parseShapefileInBatches(asyncIterator, options, context)
} as const satisfies LoaderWithParser<
  ShapefileOutput | GeoJSONTable | ArrowTable,
  ShapefileOutput | Batch | ArrowTableBatch,
  ShapefileLoaderOptions
>;
