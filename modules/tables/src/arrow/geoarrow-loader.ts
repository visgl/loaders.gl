// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table as NativeArrowTable, RecordBatch} from 'apache-arrow';
import {
  serializeArrowTableResult,
  deserializeIPCWorkerBatch,
  deserializeIPCWorkerTable
} from './lib/arrow-worker-transport';
import {convertArrowToSchema} from '@loaders.gl/core/schema-utils';
import {convertGeoArrowTableToGeoJSON} from '@loaders.gl/core/arrow-geometry/geojson-table';
import {preloadArrowCompressionDecoders} from './lib/parsers/arrow-compression';
import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import type {
  ArrowTable,
  ArrowTableBatch,
  GeoJSONTable,
  GeoJSONTableBatch
} from '@loaders.gl/core/schema';
import {parseGeoArrowSync, parseGeoArrowInBatches} from './lib/parsers/parse-geoarrow';
import type {GeoArrowLoaderOptions} from './geoarrow-loader-types';
import {GeoArrowLoader as GeoArrowLoaderMetadata} from './geoarrow-loader-types';

const {preload: _GeoArrowLoaderPreload, ...GeoArrowLoaderMetadataWithoutPreload} =
  GeoArrowLoaderMetadata;

/**
 * GeoArrowLoaderWithParser loads an Apache Arrow table, parses GeoArrow type extension data
 * to convert it to a GeoJSON table or a BinaryGeometry
 */
export const GeoArrowLoaderWithParser = {
  ...GeoArrowLoaderMetadataWithoutPreload,
  serializeWorkerResult: serializeArrowTableResult,
  /** Converts geometry on the caller after restoring Arrow extension metadata. */
  deserializeWorkerResult(result: unknown, options?: GeoArrowLoaderOptions) {
    const table = deserializeIPCWorkerTable(result);
    return options?.arrow?.shape === 'geojson-table'
      ? convertGeoArrowTableToGeoJSON(table, convertArrowToSchema(table.schema))
      : table;
  },
  serializeWorkerBatch: serializeArrowTableResult,
  deserializeWorkerBatch: deserializeIPCWorkerBatch,
  parse: async (arraybuffer: ArrayBuffer, options?: GeoArrowLoaderOptions) => {
    await preloadArrowCompressionDecoders();
    return parseGeoArrowSync(arraybuffer, options?.arrow);
  },
  parseSync: (arraybuffer: ArrayBuffer, options?: GeoArrowLoaderOptions) =>
    parseGeoArrowSync(arraybuffer, options?.arrow),
  parseInBatches: parseGeoArrowInBatches
} as const satisfies LoaderWithParser<
  ArrowTable | GeoJSONTable | NativeArrowTable, // | BinaryGeometry,
  ArrowTableBatch | GeoJSONTableBatch | RecordBatch, // | BinaryGeometry,
  GeoArrowLoaderOptions
>;
