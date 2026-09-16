// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {GeoJSONTable, ArrowTable} from '@loaders.gl/schema';
import type {Proj4CRSDefinition} from '@math.gl/proj4';
import {parseGeoPackage} from './lib/parse-geopackage';
import {GeoPackageLoader as GeoPackageLoaderMetadata} from './geopackage-loader';

const {preload: _GeoPackageLoaderPreload, ...GeoPackageLoaderMetadataWithoutPreload} =
  GeoPackageLoaderMetadata;

export type GeoPackageLoaderOptions = LoaderOptions & {
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
  };
  gis?: {
    reproject?: boolean;
    _targetCrs?: Proj4CRSDefinition;
  };
};

export const GeoPackageLoaderWithParser = {
  ...GeoPackageLoaderMetadataWithoutPreload,
  parse: parseGeoPackage
} as const satisfies LoaderWithParser<GeoJSONTable | ArrowTable, never, GeoPackageLoaderOptions>;
