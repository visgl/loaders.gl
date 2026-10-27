import {convertWKBToGeometry} from '@loaders.gl/core/arrow-geometry/geometry-codecs';
// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {StrictLoaderOptions, LoaderWithParser} from '@loaders.gl/core/loader-utils';
import type {
  Batch,
  GeoArrowEncodingPreference,
  GeoJSONTable,
  ArrowTable,
  ArrowTableBatch
} from '@loaders.gl/core/schema';
import {SHPLoaderOptions} from './shp-loader-types';
import {
  parseShapefile,
  parseShapefileInBatches,
  type ShapefileOutput
} from './lib/parsers/parse-shapefile';
import {DBFLoaderOptions} from './dbf-loader-types';
import type {SHPGeoArrowEncoding} from './lib/parsers/types';
import {parseShapefileToArrow, parseShapefileToArrowInBatches} from './shapefile-arrow-loader';
import {ShapefileLoader as ShapefileLoaderMetadata} from './shapefile-loader-types';
import {
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
      /** Overrides the browser worker bundle URL. */
      workerUrl?: string;
      shape?: 'geojson-table' | 'arrow-table' | 'v3';
      geoarrowEncoding?: SHPGeoArrowEncoding;
      /** Preferred encoding for Arrow geometry output. */
      geoarrow?: {encodingPreference?: GeoArrowEncodingPreference};
      batchSize?: number;
    };
    gis?: import('@loaders.gl/core/loader-utils').CRSReprojectionOptions;
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
  deserializeWorkerResult: deserializeShapefileOutput,
  serializeWorkerBatch: serializeShapefileWorkerBatch,
  deserializeWorkerBatch: deserializeShapefileOutput
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

/** Materializes requested GeoJSON features from hydrated WKB and property columns on the caller. */
function deserializeShapefileOutput(result: unknown, options?: ShapefileLoaderOptions): any {
  const table = deserializeShapefileWorkerResult<ArrowTable & {loaderData?: object}>(result);
  if (getShapefileShape(options) === 'arrow-table') return table;
  const features = table.data.toArray().map(row => {
    const {geometry, ...properties} = row.toJSON();
    return {
      type: 'Feature',
      geometry: geometry ? convertWKBToGeometry(geometry.slice().buffer) : null,
      properties
    };
  });
  if (getShapefileShape(options) === 'geojson-table' && !('batchType' in table)) {
    return {
      ...table.loaderData,
      shape: 'geojson-table',
      type: 'FeatureCollection',
      schema: {
        fields: table.schema?.fields.filter(field => field.name !== 'geometry') || [],
        metadata: {}
      },
      features
    };
  }
  return {...table.loaderData, data: features};
}
