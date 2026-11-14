import {convertWKBToGeometry} from '@loaders.gl/core/arrow-geometry/geometry-codecs';
// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table, RecordBatch} from 'apache-arrow';
import {makeArrowMetadataBatch} from '@loaders.gl/core/schema-utils';
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
export const ShapefileColumnLoader = {
  ...ShapefileLoaderMetadataWithoutPreload,
  dataType: null as unknown as ShapefileOutput | GeoJSONTable | ArrowTable,
  batchType: null as unknown as ShapefileOutput | Batch | ArrowTableBatch,
  parse: (arrayBuffer, options, context) =>
    getShapefileShape(options) === 'arrow'
      ? parseShapefileToArrow(arrayBuffer, options, context)
      : parseShapefile(arrayBuffer, options, context),
  parseInBatches: (asyncIterator, options, context) =>
    getShapefileShape(options) === 'arrow'
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
  return options?.shapefile?.shape || 'arrow';
}

/** Materializes requested GeoJSON features from hydrated WKB and property columns on the caller. */
function deserializeShapefileOutput(result: unknown, options?: ShapefileLoaderOptions): any {
  const table = deserializeShapefileWorkerResult<ArrowTable & {loaderData?: object}>(result);
  if (getShapefileShape(options) === 'arrow') return table;
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

/** Exposes native Arrow output after parsing or worker hydration. */
export const ShapefileLoaderWithParser = {
  ...ShapefileColumnLoader,
  dataType: null as unknown as ShapefileOutput | GeoJSONTable | Table,
  batchType: null as unknown as ShapefileOutput | Batch | RecordBatch,
  async parse(input, options, context) {
    return unwrapShapefileTable(await ShapefileColumnLoader.parse!(input, options, context));
  },
  async *parseInBatches(input, options, context) {
    for await (const batch of ShapefileColumnLoader.parseInBatches!(input, options, context)) {
      if (isShapefileArrowTable(batch)) {
        const table = unwrapShapefileTable(batch);
        if (table.batches.length) yield* table.batches;
        else yield makeArrowMetadataBatch(table.schema);
      } else yield batch;
    }
  },
  deserializeWorkerResult(result, options) {
    return unwrapShapefileTable(deserializeShapefileOutput(result, options));
  },
  deserializeWorkerBatch(result, options) {
    const batch = deserializeShapefileOutput(result, options);
    if (!isShapefileArrowTable(batch)) return batch;
    const table = unwrapShapefileTable(batch);
    return table.batches[0] ?? makeArrowMetadataBatch(table.schema);
  }
} as const satisfies LoaderWithParser<
  ShapefileOutput | GeoJSONTable | Table,
  ShapefileOutput | Batch | RecordBatch,
  ShapefileLoaderOptions
>;

/** Identifies Arrow output from the private column parser. */
function isShapefileArrowTable(result: unknown): result is ArrowTable {
  return (result as {shape?: string} | null)?.shape === 'arrow-table';
}

/** Unwraps Arrow columns and passes through legacy results. */
function unwrapShapefileTable(result: ArrowTable): Table;
function unwrapShapefileTable<T>(result: T): Exclude<T, ArrowTable> | Table;
function unwrapShapefileTable(result: unknown): unknown {
  if (!isShapefileArrowTable(result)) return result;
  const loaderData = (
    result as ArrowTable & {
      loaderData?: {
        header?: unknown;
        encoding?: string;
        prj?: string;
        shx?: {offsets: Int32Array; lengths: Int32Array};
      };
    }
  ).loaderData;
  if (loaderData) {
    const {shx, ...header} = loaderData;
    const metadata = JSON.stringify({
      ...header,
      ...(shx ? {shx: {offsets: Array.from(shx.offsets), lengths: Array.from(shx.lengths)}} : {})
    });
    result.data.schema.metadata.set('loaders.gl.shapefile.header', metadata);
    for (const batch of result.data.batches)
      batch.schema.metadata.set('loaders.gl.shapefile.header', metadata);
  }
  return result.data;
}
