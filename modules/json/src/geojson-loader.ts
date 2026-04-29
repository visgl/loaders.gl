// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {
  ArrowTable,
  ArrowTableBatch,
  BinaryFeatureCollection,
  GeoJSONTable,
  Schema,
  TableBatch
} from '@loaders.gl/schema';
import type * as arrow from 'apache-arrow';
import type {JSONLoaderOptions} from './json-loader';
import {GeoJSONFormat} from './json-format';
import type {ArrowConversionOptions} from './lib/parsers/convert-row-table-to-arrow';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type GeoJSONLoaderOptions = Omit<JSONLoaderOptions, 'json'> & {
  /** GeoJSON-specific loader options. */
  geojson?: {
    /** Requested GeoJSON output shape. */
    shape?: 'geojson-table' | 'arrow-table' | 'binary-feature-collection';
  };
  /** JSON parser and GeoArrow conversion options used by GeoJSONLoader. */
  json?: Omit<NonNullable<JSONLoaderOptions['json']>, 'shape'> & {
    /** Optional schema used when converting GeoJSON features to GeoArrow. */
    schema?: Schema | arrow.Schema;
    /** Optional recovery policy used when converting GeoJSON features to GeoArrow. */
    arrowConversion?: ArrowConversionOptions;
    /** Geometry column name to use when converting GeoJSON features to GeoArrow WKB. */
    geoarrowGeometryColumn?: string;
  };
};

/** Preloads the parser-bearing GeoJSON loader implementation. */
async function preload() {
  const {GeoJSONLoaderWithParser} = await import('./geojson-loader-with-parser');
  return GeoJSONLoaderWithParser;
}

/** Metadata-only GeoJSON worker loader. */
export const GeoJSONWorkerLoader = {
  dataType: null as unknown as GeoJSONTable | BinaryFeatureCollection | ArrowTable,
  batchType: null as unknown as TableBatch | ArrowTableBatch,

  ...GeoJSONFormat,
  version: VERSION,
  worker: true,
  options: {
    geojson: {
      shape: 'geojson-table'
    },
    json: {
      jsonpaths: ['$.features'],
      schema: undefined,
      arrowConversion: undefined,
      geoarrowGeometryColumn: undefined
    }
  },
  preload
} as const satisfies Loader<
  GeoJSONTable | BinaryFeatureCollection | ArrowTable,
  TableBatch | ArrowTableBatch,
  GeoJSONLoaderOptions
>;

/** Metadata-only GeoJSON loader. */
export const GeoJSONLoader = {
  ...GeoJSONWorkerLoader
} as const satisfies Loader<
  GeoJSONTable | BinaryFeatureCollection | ArrowTable,
  TableBatch | ArrowTableBatch,
  GeoJSONLoaderOptions
>;
