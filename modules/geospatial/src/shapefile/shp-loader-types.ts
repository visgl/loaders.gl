// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, StrictLoaderOptions} from '@loaders.gl/core/loader-utils';
import type {
  ArrowTable,
  ArrowTableBatch,
  GeoArrowEncodingPreference
} from '@loaders.gl/core/schema';
import type {SHPGeoArrowEncoding} from './lib/parsers/types';
import {SHPFormat} from './shp-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const SHP_MAGIC_NUMBER = [0x00, 0x00, 0x27, 0x0a];

/** SHPLoader */
export type SHPLoaderOptions = StrictLoaderOptions & {
  /** Preferred encoding for Arrow geometry output. */
  geoarrow?: {encodingPreference?: GeoArrowEncodingPreference};
  shp?: {
    _maxDimensions?: number;
    shape?: 'arrow-table' | 'wkb';
    geoarrowEncoding?: SHPGeoArrowEncoding;
    /** Preferred encoding for Arrow geometry output. */
    geoarrow?: {encodingPreference?: GeoArrowEncodingPreference};
    batchSize?: number;
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/** Preloads the parser-bearing SHP loader implementation. */
async function preloadSHPLoader() {
  const {SHPLoaderWithParser} = await import('@loaders.gl/geospatial/shp');
  return SHPLoaderWithParser;
}

/** Metadata-only SHP worker loader. */
export const SHPLoader: Loader<any, any, SHPLoaderOptions> = {
  dataType: null as unknown,
  batchType: null as never,

  ...SHPFormat,
  version: VERSION,
  worker: true,
  workerInBatches: true,
  options: {
    shp: {
      _maxDimensions: 4,
      shape: 'arrow-table'
    }
  },
  preload: preloadSHPLoader
} as const satisfies Loader<any | ArrowTable, any | ArrowTableBatch, SHPLoaderOptions>;

/** @deprecated Use SHPLoader. */
export const SHPWorkerLoader = SHPLoader;
