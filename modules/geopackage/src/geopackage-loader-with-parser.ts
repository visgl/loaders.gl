// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {Tables, GeoJSONTable, ArrowTable} from '@loaders.gl/schema';
import {parseGeoPackage} from './lib/parse-geopackage';
import {GeoPackageLoader as GeoPackageLoaderMetadata} from './geopackage-loader';

const {preload: _GeoPackageLoaderPreload, ...GeoPackageLoaderMetadataWithoutPreload} =
  GeoPackageLoaderMetadata;

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

export const GeoPackageLoaderWithParser = {
  ...GeoPackageLoaderMetadataWithoutPreload,
  parse: parseGeoPackage
} as const satisfies LoaderWithParser<
  GeoJSONTable | Tables<GeoJSONTable> | ArrowTable,
  never,
  GeoPackageLoaderOptions
>;
