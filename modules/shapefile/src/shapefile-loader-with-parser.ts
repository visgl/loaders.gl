// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {StrictLoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {Batch, GeoJSONTable, ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';
import {SHPLoaderOptions} from './shp-loader';
import {
  parseShapefile,
  parseShapefileInBatches,
  type ShapefileOutput
} from './lib/parsers/parse-shapefile';
import {DBFLoaderOptions} from './dbf-loader';
import {
  parseShapefileToArrow,
  parseShapefileToArrowInBatches
} from './shapefile-arrow-loader-with-parser';
import {ShapefileLoader as ShapefileLoaderMetadata} from './shapefile-loader';

const {preload: _ShapefileLoaderPreload, ...ShapefileLoaderMetadataWithoutPreload} =
  ShapefileLoaderMetadata;

export type ShapefileLoaderOptions = StrictLoaderOptions &
  SHPLoaderOptions &
  DBFLoaderOptions & {
    shapefile?: {
      shape?: 'geojson-table' | 'arrow-table' | 'v3';
      batchSize?: number;
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
export const ShapefileLoaderWithParser = {
  ...ShapefileLoaderMetadataWithoutPreload,
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
