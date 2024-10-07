// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {BinaryGeometry, Geometry} from '@loaders.gl/schema';
import {convertWKBToGeoJSON, convertWKBToBinaryGeometry, isWKB} from '@loaders.gl/gis';
import {VERSION} from './lib/version';

export type WKBLoaderOptions = LoaderOptions & {
  wkb?: {
    /** 'geometry' is deprecated use 'geojson-geometry' */
    shape: 'geojson-geometry' | 'binary-geometry';
  };
};

/**
 * Worker loader for WKB (Well-Known Binary)
 */
export const WKBWorkerLoader = {
  dataType: null as unknown as Geometry | BinaryGeometry,
  batchType: null as never,
  name: 'WKB',
  id: 'wkb',
  module: 'wkt',
  version: VERSION,
  worker: true,
  category: 'geometry',
  extensions: ['wkb'],
  mimeTypes: [],
  // TODO can we define static, serializable tests, eg. some binary strings?
  tests: [isWKB],
  options: {
    wkb: {
      shape: 'geojson-geometry'
    }
  }
} as const satisfies Loader<Geometry | BinaryGeometry, never, WKBLoaderOptions>;

/**
 * Loader for WKB (Well-Known Binary)
 */
export const WKBLoader = {
  ...WKBWorkerLoader,
  parse: async (arrayBuffer: ArrayBuffer, options?) => parseWKB(arrayBuffer, options?.wkb),
  parseSync: (arrayBuffer: ArrayBuffer, options?) => parseWKB(arrayBuffer, options?.wkb)
} as const satisfies LoaderWithParser<BinaryGeometry | Geometry, never, WKBLoaderOptions>;

export function parseWKB(
  arrayBuffer: ArrayBuffer,
  options?: {shape?: 'geojson-geometry' | 'binary-geometry'}
): BinaryGeometry | Geometry {
  const shape = options?.shape || 'binary-geometry';
  switch (shape) {
    case 'binary-geometry':
      return convertWKBToBinaryGeometry(arrayBuffer);
    case 'geojson-geometry':
      return convertWKBToGeoJSON(arrayBuffer);
    default:
      throw new Error(shape);
  }
}
