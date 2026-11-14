// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  CRSReprojectionOptions,
  StrictLoaderOptions,
  Loader
} from '@loaders.gl/core/loader-utils';
import type {Table, RecordBatch} from 'apache-arrow';
import type {Batch, GeoArrowEncodingPreference, GeoJSONTable} from '@loaders.gl/core/schema';
import type {SHPLoaderOptions} from './shp-loader-types';
import type {ShapefileOutput} from './lib/parsers/parse-shapefile';
import type {DBFLoaderOptions} from './dbf-loader-types';
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
      /** Overrides the browser worker bundle URL. */
      workerUrl?: string;
      shape?: 'geojson-table' | 'arrow' | 'v3';
      geoarrowEncoding?: SHPGeoArrowEncoding;
      /** Preferred encoding for Arrow geometry output. */
      geoarrow?: {encodingPreference?: GeoArrowEncodingPreference};
      batchSize?: number;
    };
    /** Opt-in coordinate transformation for decoded feature coordinates. */
    gis?: CRSReprojectionOptions;
  };

/** Preloads the parser-bearing Shapefile loader implementation. */
async function preloadShapefileLoader() {
  const {ShapefileLoaderWithParser} = await import('@loaders.gl/geospatial/shapefile-loader');
  return ShapefileLoaderWithParser;
}

/** Metadata-only Shapefile loader. */
export const ShapefileLoader = {
  defaultShape: 'arrow',
  supportsNativeArrow: true,
  dataType: null as unknown as ShapefileOutput | GeoJSONTable | Table,
  batchType: null as unknown as ShapefileOutput | Batch | RecordBatch,
  ...ShapefileFormat,
  version: VERSION,
  worker: true,
  workerInBatches: true,
  options: {
    shapefile: {
      shape: 'arrow'
    },
    shp: {
      _maxDimensions: 4
    }
  },
  preload: preloadShapefileLoader
} as const satisfies Loader<
  ShapefileOutput | GeoJSONTable | Table,
  ShapefileOutput | Batch | RecordBatch,
  ShapefileLoaderOptions
>;
