// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {Tables, GeoJSONTable} from '@loaders.gl/schema';
import {parseGeoPackage, DEFAULT_SQLJS_CDN} from './lib/parse-geopackage';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
// const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';
const VERSION = 'latest';

export type GeoPackageLoaderOptions = LoaderOptions & {
  /** Options for the geopackage loader */
  geopackage?: {
    /** Shape of returned data */
    shape?: 'geojson-table' | 'tables';
    /** Name of table to load (defaults to first table), unless shape==='tables' */
    table?: string;
    /** Use null in Node */
    sqlJsCDN?: string | null;
  };
  gis?: {
    reproject?: boolean;
    _targetCrs?: string;
  };
};

export const GeoPackageLoader = {
  dataType: null as unknown as GeoJSONTable | Tables<GeoJSONTable>,
  batchType: null as never,

  id: 'geopackage',
  name: 'GeoPackage',
  module: 'geopackage',
  version: VERSION,
  extensions: ['gpkg'],
  mimeTypes: ['application/geopackage+sqlite3'],
  category: 'geometry',
  parse: parseGeoPackage,
  options: {
    geopackage: {
      sqlJsCDN: DEFAULT_SQLJS_CDN,
      shape: 'tables'
    },
    gis: {}
  }
} as const satisfies LoaderWithParser<
  GeoJSONTable | Tables<GeoJSONTable>,
  never,
  GeoPackageLoaderOptions
>;
