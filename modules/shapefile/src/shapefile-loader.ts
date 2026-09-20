// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CRSReprojectionOptions, StrictLoaderOptions, Loader} from '@loaders.gl/loader-utils';
import type {
  Batch,
  GeoArrowEncodingPreference,
  GeoJSONTable,
  ArrowTable,
  ArrowTableBatch
} from '@loaders.gl/schema';
import type {SHPLoaderOptions} from './shp-loader';
import type {ShapefileOutput} from './lib/parsers/parse-shapefile';
import type {DBFLoaderOptions} from './dbf-loader';
import type {SHPGeoArrowEncoding} from './lib/parsers/types';
import {ShapefileFormat} from './shp-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type ShapefileLoaderOptions = StrictLoaderOptions &
  SHPLoaderOptions &
  DBFLoaderOptions & {
    /** Preferred encoding for Arrow geometry output. */
    geoarrow?: {encodingPreference?: GeoArrowEncodingPreference};
    shapefile?: {
      shape?: 'geojson-table' | 'arrow-table' | 'v3';
      geoarrowEncoding?: SHPGeoArrowEncoding;
      /** Preferred encoding for Arrow geometry output. */
      geoarrow?: {encodingPreference?: GeoArrowEncodingPreference};
      batchSize?: number;
    };
    /** Opt-in coordinate transformation for decoded feature coordinates. */
    gis?: CRSReprojectionOptions;
  };

/** Preloads the parser-bearing Shapefile loader implementation. */
async function preload() {
  const {ShapefileLoaderWithParser} = await import('./shapefile-loader-with-parser');
  return ShapefileLoaderWithParser;
}

/** Metadata-only Shapefile loader. */
export const ShapefileLoader = {
  dataType: null as unknown as ShapefileOutput | GeoJSONTable | ArrowTable,
  batchType: null as unknown as ShapefileOutput | Batch | ArrowTableBatch,
  ...ShapefileFormat,
  version: VERSION,
  options: {
    shapefile: {
      shape: 'arrow-table'
    },
    shp: {
      _maxDimensions: 4
    }
  },
  preload
} as const satisfies Loader<
  ShapefileOutput | GeoJSONTable | ArrowTable,
  ShapefileOutput | Batch | ArrowTableBatch,
  ShapefileLoaderOptions
>;
