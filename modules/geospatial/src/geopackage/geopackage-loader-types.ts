// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CRSReprojectionOptions, Loader, LoaderOptions} from '@loaders.gl/core/loader-utils';
import type {Table} from 'apache-arrow';
import type {GeoArrowEncodingPreference, GeoJSONTable} from '@loaders.gl/core/schema';
import {DEFAULT_SQLJS_CDN} from './geopackage-loader-options';
import {GeoPackageFormat} from './geopackage-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
// const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';
const VERSION = 'latest';

/** Options for loading GeoPackage files. */
export type GeoPackageLoaderOptions = LoaderOptions & {
  /** Preferred encoding for Arrow geometry output. */
  geoarrow?: {encodingPreference?: GeoArrowEncodingPreference};
  /** Options for the geopackage loader */
  geopackage?: {
    /** Shape of the selected table returned by the loader. */
    shape?: 'geojson-table' | 'arrow';
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
  const {GeoPackageLoaderWithParser} = await import('@loaders.gl/geospatial/geopackage-loader');
  return GeoPackageLoaderWithParser;
}

/** Metadata-only loader for GeoPackage files. */
export const GeoPackageLoader = {
  /** Matches a GeoPackage URL for source selection. */
  testURL: (url: string): boolean => /\.gpkg(?:$|[?#])/i.test(url),
  fromUrl: true,
  fromBlob: true,
  ...GeoPackageFormat,

  dataType: null as unknown as GeoJSONTable | Table,
  batchType: null as never,

  version: VERSION,
  defaultShape: 'arrow',
  supportsNativeArrow: true,
  options: {
    geopackage: {
      sqlJsCDN: DEFAULT_SQLJS_CDN,
      shape: 'arrow'
    },
    gis: {}
  },
  preload
} as const satisfies Loader<GeoJSONTable | Table, never, GeoPackageLoaderOptions>;
