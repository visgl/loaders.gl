// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {GeoJSONTable, GeoJSONTableBatch} from '@loaders.gl/schema';
import type {ArrowTable, ArrowTableBatch} from './schema/arrow-table-type';
import {parseGeoArrowSync, parseGeoArrowInBatches} from './lib/parsers/parse-geoarrow';
import type {GeoArrowLoaderOptions} from './exports/geoarrow-loader';
import {GeoArrowWorkerLoader} from './exports/geoarrow-loader';

/**
 * GeoArrowLoader loads an Apache Arrow table, parses GeoArrow type extension data
 * to convert it to a GeoJSON table or a BinaryGeometry
 */
export const GeoArrowLoader = {
  ...GeoArrowWorkerLoader,

  parse: async (arraybuffer: ArrayBuffer, options?: GeoArrowLoaderOptions) =>
    parseGeoArrowSync(arraybuffer, options?.arrow),
  parseSync: (arraybuffer: ArrayBuffer, options?: GeoArrowLoaderOptions) =>
    parseGeoArrowSync(arraybuffer, options?.arrow),
  parseInBatches: parseGeoArrowInBatches
} as const satisfies LoaderWithParser<
  ArrowTable | GeoJSONTable, // | BinaryGeometry,
  ArrowTableBatch | GeoJSONTableBatch, // | BinaryGeometry,
  GeoArrowLoaderOptions
>;
