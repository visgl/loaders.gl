// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/core/loader-utils';
import type {BinaryGeometry, Geometry} from '@loaders.gl/core/schema';
import {convertTWKBToGeometry} from '@loaders.gl/core/wkt/twkb';
import {TWKBLoader as TWKBWorkerLoaderMetadata} from './twkb-loader-types';
import {TWKBLoader as TWKBLoaderMetadata} from './twkb-loader-types';

const {preload: _TWKBWorkerLoaderPreload, ...TWKBWorkerLoaderMetadataWithoutPreload} =
  TWKBWorkerLoaderMetadata;
const {preload: _TWKBLoaderPreload, ...TWKBLoaderMetadataWithoutPreload} = TWKBLoaderMetadata;

export type WKBLoaderOptions = LoaderOptions & {
  wkb?: {
    shape: 'geojson-geometry' | 'binary-geometry';
  };
};

/**
 * Worker loader for WKB (Well-Known Binary)
 */
export const TWKBWorkerLoaderWithParser = {
  ...TWKBWorkerLoaderMetadataWithoutPreload
} as const satisfies Loader<Geometry, never, WKBLoaderOptions>;

/**
 * Loader for WKB (Well-Known Binary)
 */
export const TWKBLoaderWithParser = {
  ...TWKBLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer) => convertTWKBToGeometry(arrayBuffer),
  parseSync: convertTWKBToGeometry
} as const satisfies LoaderWithParser<BinaryGeometry | Geometry, never, WKBLoaderOptions>;
