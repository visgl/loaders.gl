// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table as ArrowTable, RecordBatch as ArrowTableBatch} from 'apache-arrow';

import type {Loader, LoaderOptions} from '@loaders.gl/core/loader-utils';
import type {
  BinaryFeatureCollection,
  GeoJSONTable,
  Schema,
  TableBatch
} from '@loaders.gl/core/schema';
import type * as arrow from 'apache-arrow';
import type {JSONLoaderOptions} from './json-loader-types';
import {GeoJSONFormat} from './json-format';
import type {ArrowConversionOptions} from './lib/parsers/convert-row-table-to-arrow';
import type {GeoArrowEncodingPreference} from '@loaders.gl/core/schema';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type GeoJSONLoaderOptions = LoaderOptions &
  Omit<JSONLoaderOptions, 'json'> & {
    /** Preferred encoding for Arrow geometry output. */
    geoarrow?: {encodingPreference?: GeoArrowEncodingPreference};
    /** GeoJSON-specific loader options. */
    geojson?: {
      /** Requested GeoJSON output shape. */
      shape?: 'arrow' | 'geojson-table' | 'binary-feature-collection';
      /** Preferred encoding for Arrow geometry output. */
      geoarrow?: {encodingPreference?: GeoArrowEncodingPreference};
    };
    /** JSON parser and GeoArrow conversion options used by GeoJSONLoader. */
    json?: Omit<NonNullable<JSONLoaderOptions['json']>, 'shape'> & {
      /** Optional schema used when converting GeoJSON features to GeoArrow. */
      schema?: Schema | arrow.Schema;
      /** Optional recovery policy used when converting GeoJSON features to GeoArrow. */
      arrowConversion?: ArrowConversionOptions;
      /** Geometry column name to use when converting GeoJSON features to GeoArrow WKB. */
      geoarrowGeometryColumn?: string;
      /** Preferred encoding for Arrow geometry output. */
      geoarrow?: {encodingPreference?: GeoArrowEncodingPreference};
    };
  };

/** Metadata-only GeoJSON worker loader. */
export const GeoJSONLoaderDefinition = {
  fetchBeforePreload: true,
  defaultShape: 'arrow',
  supportsNativeArrow: true,
  dataType: null as unknown as GeoJSONTable | BinaryFeatureCollection | ArrowTable,
  batchType: null as unknown as TableBatch | ArrowTableBatch,

  ...GeoJSONFormat,
  version: VERSION,
  worker: true,
  options: {
    geojson: {
      shape: 'arrow'
    },
    json: {
      jsonpaths: ['$.features'],
      schema: undefined,
      arrowConversion: undefined,
      geoarrowGeometryColumn: undefined
    }
  }
} as const satisfies Loader<
  GeoJSONTable | BinaryFeatureCollection | ArrowTable,
  TableBatch | ArrowTableBatch,
  GeoJSONLoaderOptions
>;
