// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {Geometry} from '@loaders.gl/schema';
import {convertWKBToGeometry} from '@loaders.gl/gis';
import {WKBWorkerLoader as WKBWorkerLoaderMetadata} from './wkb-loader';
import {WKBLoader as WKBLoaderMetadata} from './wkb-loader';

const {preload: _WKBWorkerLoaderPreload, ...WKBWorkerLoaderMetadataWithoutPreload} =
  WKBWorkerLoaderMetadata;
const {preload: _WKBLoaderPreload, ...WKBLoaderMetadataWithoutPreload} = WKBLoaderMetadata;

export type WKBLoaderOptions = LoaderOptions & {
  wkb?: {
    /** Shape is deprecated, only geojson is supported */
    shape: 'geojson-geometry';
  };
};

/**
 * Worker loader for WKB (Well-Known Binary)
 */
export const WKBWorkerLoaderWithParser = {
  ...WKBWorkerLoaderMetadataWithoutPreload
} as const satisfies Loader<Geometry, never, WKBLoaderOptions>;

/**
 * Loader for WKB (Well-Known Binary)
 */
export const WKBLoaderWithParser = {
  ...WKBLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?) => parseWKB(arrayBuffer, options?.wkb),
  parseSync: (arrayBuffer: ArrayBuffer, options?) => parseWKB(arrayBuffer, options?.wkb)
} as const satisfies LoaderWithParser<Geometry, never, WKBLoaderOptions>;

export function parseWKB(
  arrayBuffer: ArrayBuffer,
  options?: {shape?: 'geojson-geometry'}
): Geometry {
  const shape = options?.shape ?? 'geojson-geometry';
  switch (shape) {
    case 'geojson-geometry':
      return convertWKBToGeometry(arrayBuffer);
    default:
      throw new Error(shape);
  }
}
