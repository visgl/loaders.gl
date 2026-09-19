// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {StrictLoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {
  Batch,
  GeoArrowEncodingPreference,
  GeoJSONTable,
  ArrowTable,
  ArrowTableBatch
} from '@loaders.gl/schema';
import {SHPLoaderOptions} from './shp-loader';
import {
  parseShapefile,
  parseShapefileInBatches,
  type ShapefileOutput
} from './lib/parsers/parse-shapefile';
import {DBFLoaderOptions} from './dbf-loader';
import type {SHPGeoArrowEncoding} from './lib/parsers/types';
import {
  parseShapefileToArrow,
  parseShapefileToArrowInBatches
} from './shapefile-arrow-loader-with-parser';
import {ShapefileLoader as ShapefileLoaderMetadata} from './shapefile-loader';
import type {Proj4CRSDefinition} from '@math.gl/proj4';
import {
  deserializeShapefileWorkerBatch,
  deserializeShapefileWorkerResult,
  serializeShapefileWorkerBatch,
  serializeShapefileWorkerResult
} from './lib/shapefile-worker-transport';

const {preload: _ShapefileLoaderPreload, ...ShapefileLoaderMetadataWithoutPreload} =
  ShapefileLoaderMetadata;

export type ShapefileLoaderOptions = StrictLoaderOptions &
  SHPLoaderOptions &
  DBFLoaderOptions & {
    /** Preferred encoding for Arrow geometry output. */
    geoarrow?: {encodingPreference?: GeoArrowEncodingPreference};
    shapefile?: {
      shape?: 'geojson-table' | 'arrow-table' | 'v3';
      geoarrowEncoding?: SHPGeoArrowEncoding;
      /** Preferred encoding for Arrow geometry output. */
      geoarrow?: {encodingPreference?: GeoArrowEncodingPreference};
      batchSize?: number;
    };
    gis?: {
      reproject?: boolean;
      _targetCrs?: Proj4CRSDefinition;
    };
  };

/**
 * Shapefile loader
 * @note Shapefile is multifile format and requires providing additional files
 */
export const ShapefileLoaderWithParser = {
  ...ShapefileLoaderMetadataWithoutPreload,
  parse: (arrayBuffer, options, context) =>
    getShapefileShape(options) === 'arrow-table'
      ? parseShapefileToArrow(arrayBuffer, options, context)
      : parseShapefile(arrayBuffer, options, context),
  parseInBatches: (asyncIterator, options, context) =>
    getShapefileShape(options) === 'arrow-table'
      ? parseShapefileToArrowInBatches(asyncIterator, options, context)
      : parseShapefileInBatches(asyncIterator, options, context),
  serializeWorkerResult: serializeShapefileWorkerResult,
  deserializeWorkerResult: deserializeShapefileWorkerResult,
  serializeWorkerBatch: serializeShapefileWorkerBatch,
  deserializeWorkerBatch: deserializeShapefileWorkerBatch
} as const satisfies LoaderWithParser<
  ShapefileOutput | GeoJSONTable | ArrowTable,
  ShapefileOutput | Batch | ArrowTableBatch,
  ShapefileLoaderOptions
>;

function getShapefileShape(
  options?: ShapefileLoaderOptions
): NonNullable<ShapefileLoaderOptions['shapefile']>['shape'] {
  return options?.shapefile?.shape || 'arrow-table';
}
