// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {serializeArrowIPCResult, deserializeArrowIPCBatch} from './lib/arrow-worker-transport';
import {convertGeoArrowTableToGeoJSON} from '@loaders.gl/arrow-geometry/geojson-table';
import {preloadArrowCompressionDecoders} from './lib/parsers/arrow-compression';
import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import type {
  ArrowTable,
  ArrowTableBatch,
  GeoJSONTable,
  GeoJSONTableBatch
} from '@loaders.gl/core/schema';
import {parseGeoArrowSync, parseGeoArrowInBatches} from './lib/parsers/parse-geoarrow';
import type {GeoArrowLoaderOptions} from './exports/geoarrow-loader';
import {GeoArrowLoader as GeoArrowLoaderMetadata} from './geoarrow-loader-types';

const {preload: _GeoArrowLoaderPreload, ...GeoArrowLoaderMetadataWithoutPreload} =
  GeoArrowLoaderMetadata;

/**
 * GeoArrowLoaderWithParser loads an Apache Arrow table, parses GeoArrow type extension data
 * to convert it to a GeoJSON table or a BinaryGeometry
 */
export const GeoArrowLoaderWithParser = {
  ...GeoArrowLoaderMetadataWithoutPreload,
  serializeWorkerResult: serializeArrowIPCResult,
  /** Converts geometry on the caller after restoring Arrow extension metadata. */
  deserializeWorkerResult(result: unknown, options?: GeoArrowLoaderOptions) {
    const table = deserializeArrowIPCBatch(result);
    if (options?.arrow?.shape === 'geojson-table' && !table.schema) {
      throw new Error('Arrow table is missing its schema');
    }
    return options?.arrow?.shape === 'geojson-table'
      ? convertGeoArrowTableToGeoJSON(table.data, table.schema!)
      : table;
  },
  serializeWorkerBatch: serializeArrowIPCResult,
  deserializeWorkerBatch: deserializeArrowIPCBatch,
  parse: async (arraybuffer: ArrayBuffer, options?: GeoArrowLoaderOptions) => {
    await preloadArrowCompressionDecoders();
    return parseGeoArrowSync(arraybuffer, options?.arrow);
  },
  parseSync: (arraybuffer: ArrayBuffer, options?: GeoArrowLoaderOptions) =>
    parseGeoArrowSync(arraybuffer, options?.arrow),
  parseInBatches: parseGeoArrowInBatches
} as const satisfies LoaderWithParser<
  ArrowTable | GeoJSONTable, // | BinaryGeometry,
  ArrowTableBatch | GeoJSONTableBatch, // | BinaryGeometry,
  GeoArrowLoaderOptions
>;
