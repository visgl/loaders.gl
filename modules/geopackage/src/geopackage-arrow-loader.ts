// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';

import type {GeoPackageLoaderOptions} from './geopackage-loader';
import {DEFAULT_SQLJS_CDN, parseGeoPackageToArrow} from './lib/parse-geopackage';
import {GeoPackageFormat} from './geopackage-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for parsing one GeoPackage table into an Arrow table. */
export type GeoPackageArrowLoaderOptions = GeoPackageLoaderOptions;

/**
 * Creates a GeoPackage Arrow loader specialized to one optional table name.
 *
 * The returned loader parses a single vector table and emits an Arrow table with a
 * WKB `geometry` column annotated using geospatial schema metadata.
 */
export function GeoPackageArrowLoader(
  tableName?: string
): LoaderWithParser<ArrowTable, never, GeoPackageArrowLoaderOptions> {
  return {
    ...GeoPackageFormat,
    id: 'geopackage-arrow',
    name: 'GeoPackage Arrow',
    version: VERSION,
    dataType: null as unknown as ArrowTable,
    batchType: null as never,
    worker: false,
    parse: async (arrayBuffer: ArrayBuffer, options?: GeoPackageArrowLoaderOptions) =>
      parseGeoPackageToArrow(arrayBuffer, {
        ...options,
        geopackage: {
          ...options?.geopackage,
          sqlJsCDN: options?.geopackage?.sqlJsCDN ?? DEFAULT_SQLJS_CDN,
          table: tableName || options?.geopackage?.table
        }
      }),
    options: {
      geopackage: {
        sqlJsCDN: DEFAULT_SQLJS_CDN,
        table: tableName
      },
      gis: {}
    }
  };
}
