// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createGeoPackageSource} from './geopackage-source-loader';
import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import type {Table} from 'apache-arrow';
import type {GeoJSONTable} from '@loaders.gl/core/schema';
import {parseGeoPackage} from './lib/parse-geopackage';
import {GeoPackageLoader as GeoPackageLoaderMetadata} from './geopackage-loader-types';

import type {GeoPackageLoaderOptions} from './geopackage-loader-types';

const {preload: _GeoPackageLoaderPreload, ...GeoPackageLoaderMetadataWithoutPreload} =
  GeoPackageLoaderMetadata;

export type {GeoPackageLoaderOptions} from './geopackage-loader-types';

/** Parser-bearing loader for GeoPackage files. */
export const GeoPackageLoaderWithParser = {
  createDataSourceSync: createGeoPackageSource,
  ...GeoPackageLoaderMetadataWithoutPreload,
  parse: parseGeoPackage
} as const satisfies LoaderWithParser<GeoJSONTable | Table, never, GeoPackageLoaderOptions>;
