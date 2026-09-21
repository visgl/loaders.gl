// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CRSReprojectionOptions, Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {GeoArrowEncodingPreference, GeoJSONTable, ArrowTable} from '@loaders.gl/schema';
import {DEFAULT_SQLJS_CDN} from './lib/parse-geopackage';
import {GeoPackageFormat} from './geopackage-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
// const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';
const VERSION = 'latest';

export type GeoPackageLoaderOptions = LoaderOptions & {
  /** Preferred encoding for Arrow geometry output. */
  geoarrow?: {encodingPreference?: GeoArrowEncodingPreference};
  /** Options for the geopackage loader */
  geopackage?: {
    /** Shape of the selected table returned by the loader. */
    shape?: 'geojson-table' | 'arrow-table';
    /** Name of table to load (defaults to the metadata-selected vector table). */
    table?: string;
    /** Use null in Node */
    sqlJsCDN?: string | null;
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
    /** Preferred encoding for Arrow geometry output. */
    geoarrow?: {encodingPreference?: GeoArrowEncodingPreference};
  };
  /** Opt-in coordinate transformation for decoded feature coordinates. */
  gis?: CRSReprojectionOptions;
};

/** Preloads the parser-bearing GeoPackage loader implementation. */
async function preload() {
  const {GeoPackageLoaderWithParser} = await import('./geopackage-loader-with-parser');
  return GeoPackageLoaderWithParser;
}

/** Metadata-only loader for GeoPackage files. */
export const GeoPackageLoader = {
  ...GeoPackageFormat,

  dataType: null as unknown as GeoJSONTable | ArrowTable,
  batchType: null as never,

  version: VERSION,
  options: {
    geopackage: {
      sqlJsCDN: DEFAULT_SQLJS_CDN,
      shape: 'arrow-table'
    },
    gis: {}
  },
  preload
} as const satisfies Loader<GeoJSONTable | ArrowTable, never, GeoPackageLoaderOptions>;
