// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {ArrowWorkerLoader} from './arrow-loader';
import type {GeoJSONTable, GeoJSONTableBatch, BinaryGeometry} from '@loaders.gl/schema';
import type {ArrowTable, ArrowTableBatch} from './lib/arrow-table';
import {parseGeoArrowSync} from './parsers/parse-geoarrow-sync';
import {parseGeoArrowInBatches} from './parsers/parse-geoarrow-in-batches';

export type GeoArrowLoaderOptions = LoaderOptions & {
  arrow?: {
    shape?: 'arrow-table' | 'binary-geometry';
  };
};

/** ArrowJS table loader */
export const GeoArrowWorkerLoader = {
  ...ArrowWorkerLoader,
  options: {
    arrow: {
      shape: 'arrow-table'
    }
  }
} as const satisfies Loader<ArrowTable | BinaryGeometry, never, GeoArrowLoaderOptions>;

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
