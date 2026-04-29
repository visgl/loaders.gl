// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {StrictLoaderOptions, Loader} from '@loaders.gl/loader-utils';
import type {Batch, GeoJSONTable, ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';
import type {SHPLoaderOptions} from './shp-loader';
import type {ShapefileOutput} from './lib/parsers/parse-shapefile';
import type {DBFLoaderOptions} from './dbf-loader';
import {ShapefileFormat} from './shp-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type ShapefileLoaderOptions = StrictLoaderOptions &
  SHPLoaderOptions &
  DBFLoaderOptions & {
    shapefile?: {
      shape?: 'geojson-table' | 'arrow-table' | 'v3';
      /** @deprecated Worker URLs must be specified with .dbf.workerUrl * .shp.workerUrl */
      workerUrl?: never;
    };
    gis?: {
      reproject?: boolean;
      _targetCrs?: string;
    };
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
      shape: 'v3'
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
