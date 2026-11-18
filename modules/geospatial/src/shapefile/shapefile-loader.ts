import {convertWKBToGeometry} from '@loaders.gl/core/arrow-geometry/geometry-codecs';
// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table, RecordBatch} from 'apache-arrow';
import {convertArrowToSchema} from '@loaders.gl/core/schema-utils';
import type {StrictLoaderOptions, LoaderWithParser} from '@loaders.gl/core/loader-utils';
import type {Batch, GeoArrowEncodingPreference, GeoJSONTable} from '@loaders.gl/core/schema';
import {SHPLoaderOptions} from './shp-loader-types';
import {
  parseShapefile,
  parseShapefileInBatches,
  type ShapefileOutput
} from './lib/parsers/parse-shapefile';
import {DBFLoaderOptions} from './dbf-loader-types';
import type {SHPGeoArrowEncoding} from './lib/parsers/types';
import {
  parseShapefileToArrow,
  parseShapefileToArrowInBatches,
  SHAPEFILE_HEADER_KEY
} from './shapefile-arrow-loader';
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
      shape?: 'geojson-table' | 'arrow' | 'v3';
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
  dataType: null as unknown as ShapefileOutput | GeoJSONTable | Table,
  batchType: null as unknown as ShapefileOutput | Batch | RecordBatch,
  parse: (arrayBuffer, options, context) =>
    getShapefileShape(options) === 'arrow'
      ? parseShapefileToArrow(arrayBuffer, options, context)
      : parseShapefile(arrayBuffer, options, context),
  parseInBatches: (asyncIterator, options, context) =>
    getShapefileShape(options) === 'arrow'
      ? parseShapefileToArrowInBatches(asyncIterator, options, context)
      : parseShapefileInBatches(asyncIterator, options, context),
  serializeWorkerResult: serializeShapefileWorkerResult,
  deserializeWorkerResult: (result, options) => deserializeShapefileOutput(result, options, false),
  serializeWorkerBatch: serializeShapefileWorkerBatch,
  deserializeWorkerBatch: (result, options) => deserializeShapefileOutput(result, options, true)
} as const satisfies LoaderWithParser<
  ShapefileOutput | GeoJSONTable | Table,
  ShapefileOutput | Batch | RecordBatch,
  ShapefileLoaderOptions
>;

function getShapefileShape(
  options?: ShapefileLoaderOptions
): NonNullable<ShapefileLoaderOptions['shapefile']>['shape'] {
  return options?.shapefile?.shape || 'arrow';
}

/** Materializes requested GeoJSON features from native worker columns on the caller. */
function deserializeShapefileOutput(
  result: unknown,
  options: ShapefileLoaderOptions | undefined,
  isBatch: boolean
): any {
  const table = deserializeShapefileWorkerResult<Table | RecordBatch>(result);
  if (getShapefileShape(options) === 'arrow') return table;

  const header = JSON.parse(table.schema.metadata.get(SHAPEFILE_HEADER_KEY) || '{}');
  const loaderData = header.shx
    ? {
        ...header,
        shx: {
          offsets: Int32Array.from(header.shx.offsets),
          lengths: Int32Array.from(header.shx.lengths)
        }
      }
    : header;
  const features = table.toArray().map(row => {
    const {geometry, ...properties} = row!.toJSON();
    return {
      type: 'Feature',
      geometry: geometry ? convertWKBToGeometry(geometry.slice().buffer) : null,
      properties
    };
  });
  if (getShapefileShape(options) === 'geojson-table' && !isBatch) {
    return {
      ...loaderData,
      shape: 'geojson-table',
      type: 'FeatureCollection',
      schema: {
        fields: convertArrowToSchema(table.schema).fields.filter(
          field => field.name !== 'geometry'
        ),
        metadata: {}
      },
      features
    };
  }
  return {...loaderData, data: features};
}
