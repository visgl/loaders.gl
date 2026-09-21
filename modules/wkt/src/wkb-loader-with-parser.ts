// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {Geometry} from '@loaders.gl/schema';
import {parseWKB as parseMathWKB} from '@math.gl/wkb';
import {WKBWorkerLoader as WKBWorkerLoaderMetadata} from './wkb-loader';
import {WKBLoader as WKBLoaderMetadata} from './wkb-loader';

const {preload: _WKBWorkerLoaderPreload, ...WKBWorkerLoaderMetadataWithoutPreload} =
  WKBWorkerLoaderMetadata;
const {preload: _WKBLoaderPreload, ...WKBLoaderMetadataWithoutPreload} = WKBLoaderMetadata;

export type WKBLoaderOptions = LoaderOptions & {
  wkb?: {
    /** Shape is deprecated, only geojson is supported */
    shape?: 'geojson-geometry';
    /** Override the URL to the shared WKT/WKB worker bundle. */
    workerUrl?: string;
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
  arrayBuffer: ArrayBufferLike,
  options?: {shape?: 'geojson-geometry'}
): Geometry {
  const shape = options?.shape ?? 'geojson-geometry';
  switch (shape) {
    case 'geojson-geometry':
      return normalizeEmptyPoints(
        parseMathWKB(new Uint8Array(arrayBuffer)).geometry as unknown as Geometry
      );
    default:
      throw new Error(shape);
  }
}

/** Normalizes OGC empty points to loaders.gl's empty coordinate representation. */
export function normalizeEmptyPoints(geometry: Geometry): Geometry {
  if (geometry.type === 'Point') {
    return geometry.coordinates.length > 0 && geometry.coordinates.every(Number.isNaN)
      ? {...geometry, coordinates: []}
      : geometry;
  }
  if (geometry.type === 'MultiPoint') {
    const coordinates = geometry.coordinates.map(coordinate =>
      coordinate.length > 0 && coordinate.every(Number.isNaN) ? [] : coordinate
    );
    return coordinates.some((coordinate, index) => coordinate !== geometry.coordinates[index])
      ? {...geometry, coordinates}
      : geometry;
  }
  if (geometry.type === 'GeometryCollection') {
    const geometries = geometry.geometries.map(normalizeEmptyPoints);
    return geometries.some((child, index) => child !== geometry.geometries[index])
      ? {...geometry, geometries}
      : geometry;
  }
  return geometry;
}
