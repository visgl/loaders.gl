// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {ArrowWorkerLoader} from './arrow-loader';
import type {GeoJSONTable, GeoJSONTableBatch, BinaryGeometry} from '@loaders.gl/schema';
import type {ArrowTable, ArrowTableBatch} from './lib/arrow-table';
import {parseGeoArrowSync} from './parsers/parse-geoarrow-sync';
import {parseGeoArrowInBatches} from './parsers/parse-geoarrow-in-batches';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type GeoArrowLoaderOptions = LoaderOptions & {
  arrow?: {
    shape: 'arrow-table' | 'binary-geometry';
  };
};

/** ArrowJS table loader */
export const GeoArrowWorkerLoader: Loader<
  ArrowTable | BinaryGeometry,
  never,
  GeoArrowLoaderOptions
> = {
  ...ArrowWorkerLoader,
  options: {
    arrow: {
      shape: 'arrow-table'
    }
  }
};

/**
 * GeoArrowLoader loads an Apache Arrow table, parses GeoArrow type extension data
 * to convert it to a GeoJSON table or a BinaryGeometry
 */
export const GeoArrowLoader: LoaderWithParser<
  ArrowTable | GeoJSONTable, // | BinaryGeometry,
  ArrowTableBatch | GeoJSONTableBatch, // | BinaryGeometry,
  GeoArrowLoaderOptions
> = {
  ...ArrowWorkerLoader,
  options: {
    arrow: {
      shape: 'arrow-table'
    }
  },
  parse: async (arraybuffer: ArrayBuffer, options?: GeoArrowLoaderOptions) =>
    parseGeoArrowSync(arraybuffer, options?.arrow),
  parseSync: (arraybuffer: ArrayBuffer, options?: GeoArrowLoaderOptions) =>
    parseGeoArrowSync(arraybuffer, options?.arrow),
  parseInBatches: parseGeoArrowInBatches
};
