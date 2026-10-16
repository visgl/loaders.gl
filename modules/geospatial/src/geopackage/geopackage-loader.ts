// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {GeoJSONTable, ArrowTable} from '@loaders.gl/schema';
import {parseGeoPackage} from './lib/parse-geopackage';
import {GeoPackageLoader as GeoPackageLoaderMetadata} from './geopackage-loader-types';

import type {GeoPackageLoaderOptions} from './geopackage-loader-types';

const {preload: _GeoPackageLoaderPreload, ...GeoPackageLoaderMetadataWithoutPreload} =
  GeoPackageLoaderMetadata;

export type {GeoPackageLoaderOptions} from './geopackage-loader-types';

/** Parser-bearing loader for GeoPackage files. */
export const GeoPackageLoaderWithParser = {
  ...GeoPackageLoaderMetadataWithoutPreload,
  parse: parseGeoPackage
} as const satisfies LoaderWithParser<GeoJSONTable | ArrowTable, never, GeoPackageLoaderOptions>;
