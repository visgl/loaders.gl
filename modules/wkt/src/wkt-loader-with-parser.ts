// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {Geometry} from '@loaders.gl/schema';
import {convertWKTToGeometry} from '@loaders.gl/gis';
import {WKTWorkerLoader as WKTWorkerLoaderMetadata} from './wkt-loader';
import {WKTLoader as WKTLoaderMetadata} from './wkt-loader';

const {preload: _WKTWorkerLoaderPreload, ...WKTWorkerLoaderMetadataWithoutPreload} =
  WKTWorkerLoaderMetadata;
const {preload: _WKTLoaderPreload, ...WKTLoaderMetadataWithoutPreload} = WKTLoaderMetadata;

export type WKTLoaderOptions = LoaderOptions & {
  /** Options for the WKTLoaderWithParser */
  wkt?: {
    /** Shape of returned geometry */
    shape?: 'geojson-geometry'; // 'binary-geometry'
    /** Whether to add any CRS, if found, as undocumented CRS property on the returned geometry */
    crs?: boolean;
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/**
 * Well-Known text worker loader
 */
export const WKTWorkerLoaderWithParser = {
  ...WKTWorkerLoaderMetadataWithoutPreload
} as const satisfies Loader<Geometry, never, WKTLoaderOptions>;

/**
 * Well-Known text loader
 */
export const WKTLoaderWithParser = {
  ...WKTLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer, options?) =>
    convertWKTToGeometry(new TextDecoder().decode(arrayBuffer), options)!,
  parseTextSync: (string: string, options?) => convertWKTToGeometry(string, options)!
} as const satisfies LoaderWithParser<Geometry, never, WKTLoaderOptions>;
