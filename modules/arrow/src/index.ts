// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArrowLoaderOptions} from './arrow-loader';
import type {ArrowTableBatch, ColumnarTable, ObjectRowTable} from '@loaders.gl/schema';
import type {ArrowTable} from './lib/arrow-table';

import {TableBatchBuilder} from '@loaders.gl/schema';
import {ArrowLoader as ArrowWorkerLoader} from './arrow-loader';
import parseSync from './lib/parse-arrow-sync';
import {parseArrowInBatches} from './lib/parse-arrow-in-batches';

import {ArrowTableBatchAggregator} from './lib/arrow-table-batch';

// Make the ArrowBatch type available
TableBatchBuilder.ArrowBatch = ArrowTableBatchAggregator;

// TYPES

export {getArrowType} from './schema/arrow-type-utils';

// SCHEMA

export {
  serializeArrowSchema,
  deserializeArrowSchema,
  serializeArrowMetadata,
  deserializeArrowMetadata,
  serializeArrowField,
  deserializeArrowField,
  serializeArrowType,
  deserializeArrowType
} from './schema/convert-arrow-schema';

// Types
export type {ArrowTable, ArrowTableBatch} from './lib/arrow-table';
export {VECTOR_TYPES} from './types';

// Arrow writer

export {ArrowWriter} from './arrow-writer';

// Arrow loader

export type {ArrowLoaderOptions};
export {ArrowWorkerLoader};

/** ArrowJS table loader */
export const ArrowLoader: LoaderWithParser<
  ArrowTable | ColumnarTable | ObjectRowTable,
  ArrowTableBatch,
  ArrowLoaderOptions
> = {
  ...ArrowWorkerLoader,
  parse: async (arraybuffer: ArrayBuffer, options?: ArrowLoaderOptions) =>
    parseSync(arraybuffer, options),
  parseSync,
  parseInBatches: parseArrowInBatches
};

// Arrow Utils
export type {GeoArrowEncoding} from '@loaders.gl/gis';
// getGeometryColumnsFromArrowTable,
// getGeoArrowEncoding

export type {
  BinaryDataFromGeoArrow,
  BinaryGeometriesFromArrowOptions
} from './geoarrow/convert-geoarrow-to-binary-geometry';
export {
  BINARY_GEOMETRY_TEMPLATE,
  getBinaryGeometriesFromArrow,
  getTriangleIndices,
  getMeanCentersFromBinaryGeometries
} from './geoarrow/convert-geoarrow-to-binary-geometry';

export {parseGeometryFromArrow} from './geoarrow/convert-geoarrow-to-geojson';

export {updateBoundsFromGeoArrowSamples} from './geoarrow/get-arrow-bounds';

// EXPERIMENTAL

export {TriangulationWorker, triangulateOnWorker} from './triangulate-on-worker';
