// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';

import {
  GeoPackageArrowLoader as GeoPackageArrowLoaderMetadata,
  type GeoPackageArrowLoaderOptions
} from './geopackage-arrow-loader';
import {GeoPackageLoaderWithParser} from './geopackage-loader-with-parser';
import {DEFAULT_SQLJS_CDN} from './lib/parse-geopackage';

export type {GeoPackageArrowLoaderOptions} from './geopackage-arrow-loader';

/**
 * Creates a GeoPackage Arrow loader specialized to one optional table name.
 *
 * The returned loader parses a single vector table and emits an Arrow table with a
 * WKB `geometry` column annotated using geospatial schema metadata.
 */
export function GeoPackageArrowLoaderWithParser(
  tableName?: string
): LoaderWithParser<ArrowTable, never, GeoPackageArrowLoaderOptions> {
  const metadataLoader = GeoPackageArrowLoaderMetadata(tableName);
  const {preload: _GeoPackageArrowLoaderPreload, ...metadataLoaderWithoutPreload} = metadataLoader;

  return {
    ...metadataLoaderWithoutPreload,
    parse: async (arrayBuffer: ArrayBuffer, options?: GeoPackageArrowLoaderOptions) =>
      GeoPackageLoaderWithParser.parse(
        arrayBuffer,
        withArrowShape(options, tableName)
      ) as Promise<ArrowTable>
  };
}

function withArrowShape(
  options: GeoPackageArrowLoaderOptions | undefined,
  tableName?: string
): GeoPackageArrowLoaderOptions {
  return {
    ...options,
    geopackage: {
      ...options?.geopackage,
      sqlJsCDN: options?.geopackage?.sqlJsCDN ?? DEFAULT_SQLJS_CDN,
      table: tableName || options?.geopackage?.table,
      shape: 'arrow-table'
    }
  };
}
