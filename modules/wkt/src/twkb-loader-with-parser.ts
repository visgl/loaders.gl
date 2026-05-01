// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {BinaryGeometry, Geometry} from '@loaders.gl/schema';
import {convertTWKBToGeometry} from '@loaders.gl/gis';
import {TWKBWorkerLoader as TWKBWorkerLoaderMetadata} from './twkb-loader';
import {TWKBLoader as TWKBLoaderMetadata} from './twkb-loader';

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
