// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowLoaderOptions} from './arrow-loader';
import {TableBatchBuilder} from '@loaders.gl/schema';
import {ArrowTableBatchAggregator} from './lib/arrow-table-batch';

// Make the ArrowBatch type available
TableBatchBuilder.ArrowBatch = ArrowTableBatchAggregator;

// TYPES

export {getArrowType} from './schema/arrow-type-utils';

// SCHEMA

// Types
export type {ArrowTable, ArrowTableBatch} from './lib/arrow-table';
export {VECTOR_TYPES} from './types';

// Arrow loader / Writer

export type {ArrowLoaderOptions};
export {ArrowLoader, ArrowWorkerLoader} from './arrow-loader';

export {ArrowWriter} from './arrow-writer';

// Geoarrow loader
export {GeoArrowLoader, GeoArrowWorkerLoader} from './geoarrow-loader';

// Schema utils
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

// EXPERIMENTAL

// Arrow Utils
export type {GeoArrowEncoding} from '@loaders.gl/gis';
// getGeometryColumnsFromArrowTable,
// getGeoArrowEncoding

export type {
  BinaryDataFromGeoArrow,
  BinaryGeometriesFromArrowOptions
} from './geoarrow/convert-geoarrow-to-binary-geometry';
export {
  getBinaryGeometryTemplate,
  getBinaryGeometriesFromArrow,
  getTriangleIndices,
  getMeanCentersFromBinaryGeometries
} from './geoarrow/convert-geoarrow-to-binary-geometry';

export {updateBoundsFromGeoArrowSamples} from './geoarrow/get-arrow-bounds';

export {parseGeometryFromArrow} from './geoarrow/convert-geoarrow-to-geojson-geometry';

export {convertArrowToGeoJSONTable} from './tables/convert-arrow-to-geojson-table';

// EXPERIMENTAL WORKER
export {hardClone} from './workers/hard-clone';

export type {ParseGeoArrowInput, ParseGeoArrowResult} from './triangulate-on-worker';
export {
  TriangulationWorker,
  triangulateOnWorker,
  parseGeoArrowOnWorker
} from './triangulate-on-worker';
