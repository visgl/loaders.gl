// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Types
export type {ArrowTable, ArrowTableBatch} from './schema/arrow-table-type';
export {VECTOR_TYPES} from './lib/types';
import {ArrowTableBatchAggregator} from './schema/arrow-table-batch';

// Make the ArrowBatch type available
import {TableBatchBuilder} from '@loaders.gl/schema';
TableBatchBuilder.ArrowBatch = ArrowTableBatchAggregator;

// Arrow loader / Writer

export type {ArrowLoaderOptions} from './exports/arrow-loader';
export {ArrowWorkerLoader} from './exports/arrow-loader';
export {ArrowLoader} from './arrow-loader';

export {ArrowWriter} from './arrow-writer';

// Geoarrow loader
export {GeoArrowWorkerLoader} from './exports/geoarrow-loader';
export {GeoArrowLoader} from './geoarrow-loader';

// Schema utils
export {
  convertArrowToSchema,
  convertSchemaToArrow,

  // DETAILED FUNCTIONS
  serializeArrowSchema,
  deserializeArrowSchema,
  serializeArrowMetadata,
  deserializeArrowMetadata,
  serializeArrowField,
  deserializeArrowField,
  serializeArrowType,
  deserializeArrowType
} from './lib//tables/convert-arrow-schema';

// Table utils
export {convertArrowToTable} from './lib/tables/convert-arrow-to-table';
export {convertTableToArrow} from './lib/tables/convert-table-to-arrow';

// EXPERIMENTAL

// Arrow Utils
export type {GeoArrowEncoding} from '@loaders.gl/gis';
// getGeometryColumnsFromArrowTable,
// getGeoArrowEncoding

export type {
  BinaryDataFromGeoArrow,
  BinaryGeometriesFromArrowOptions
} from './lib/geoarrow/convert-geoarrow-to-binary-geometry';
export {
  getBinaryGeometryTemplate,
  getBinaryGeometriesFromArrow,
  getTriangleIndices,
  getMeanCentersFromBinaryGeometries
} from './lib/geoarrow/convert-geoarrow-to-binary-geometry';

export {updateBoundsFromGeoArrowSamples} from './lib/geoarrow/get-arrow-bounds';

export {parseGeometryFromArrow} from './lib/geoarrow/convert-geoarrow-to-geojson-geometry';

// EXPERIMENTAL WORKER
export {hardClone} from './workers/hard-clone';

export type {ParseGeoArrowInput, ParseGeoArrowResult} from './triangulate-on-worker';
export {
  TriangulationWorker,
  triangulateOnWorker,
  parseGeoArrowOnWorker
} from './triangulate-on-worker';
