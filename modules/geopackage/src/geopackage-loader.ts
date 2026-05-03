// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {Tables, GeoJSONTable, ArrowTable} from '@loaders.gl/schema';
import {DEFAULT_SQLJS_CDN} from './lib/parse-geopackage';
import {GeoPackageFormat} from './geopackage-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
// const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';
const VERSION = 'latest';

export type GeoPackageLoaderOptions = LoaderOptions & {
  /** Options for the geopackage loader */
  geopackage?: {
    /** Shape of returned data */
    shape?: 'geojson-table' | 'arrow-table' | 'tables';
    /** Name of table to load (defaults to first table), unless shape==='tables' */
    table?: string;
    /** Use null in Node */
    sqlJsCDN?: string | null;
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
  gis?: {
    reproject?: boolean;
    _targetCrs?: string;
  };
};

/** Preloads the parser-bearing GeoPackage loader implementation. */
async function preload() {
  const {GeoPackageLoaderWithParser} = await import('./geopackage-loader-with-parser');
  return GeoPackageLoaderWithParser;
}

/** Metadata-only loader for GeoPackage files. */
export const GeoPackageLoader = {
  ...GeoPackageFormat,

  dataType: null as unknown as GeoJSONTable | Tables<GeoJSONTable> | ArrowTable,
  batchType: null as never,

  version: VERSION,
  options: {
    geopackage: {
      sqlJsCDN: DEFAULT_SQLJS_CDN,
      shape: 'tables'
    },
    gis: {}
  },
  preload
} as const satisfies Loader<
  GeoJSONTable | Tables<GeoJSONTable> | ArrowTable,
  never,
  GeoPackageLoaderOptions
>;
