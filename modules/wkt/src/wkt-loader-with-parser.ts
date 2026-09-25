// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {Geometry} from '@loaders.gl/schema';
import {parseWKTWithMetadata} from '@math.gl/wkb';
import type {WellKnownDimension, WKTParseResult} from '@math.gl/wkb';
import {WKTWorkerLoader as WKTWorkerLoaderMetadata} from './wkt-loader';
import {WKTLoader as WKTLoaderMetadata} from './wkt-loader';
import {normalizeEmptyPoints} from './geometry-utils';

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
    parseWKTGeometry(new TextDecoder().decode(arrayBuffer), options?.wkt),
  parseTextSync: (string: string, options?) => parseWKTGeometry(string, options?.wkt)
} as const satisfies LoaderWithParser<Geometry, never, WKTLoaderOptions>;

/** Parses WKT with loaders.gl's legacy SRID and invalid-input behavior. */
function parseWKTGeometry(input: string, options?: WKTLoaderOptions['wkt']): Geometry {
  const {text, srid, dimension} = splitWKTHeader(input);
  try {
    // Preserve the legacy parser's treatment of empty parentheses as invalid input.
    if (/\(\s*\)\s*$/s.test(text)) {
      return null as unknown as Geometry;
    }
    const collectionHeader = text.match(/^(\s*GEOMETRYCOLLECTION)\s+(?:ZM|Z|M)(?=\s|\()/i);
    const parseText =
      collectionHeader && dimension !== 'xym'
        ? text.replace(collectionHeader[0], collectionHeader[1])
        : text;
    const parsed = parseWKTWithMetadata(parseText, {inferDimensions: true});
    const geometry = toGeometryWithDimensionMetadata(
      parsed,
      collectionHeader ? dimension : undefined
    );
    if (options?.crs && srid !== undefined) {
      Object.defineProperty(geometry, 'crs', {
        configurable: true,
        enumerable: true,
        value: {
          type: 'name',
          properties: {name: `urn:ogc:def:crs:EPSG::${srid}`}
        }
      });
    }
    return geometry;
  } catch {
    return null as unknown as Geometry;
  }
}

/** Converts parsed WKT metadata to loaders.gl geometries with legacy dimension markers. */
function toGeometryWithDimensionMetadata(
  result: WKTParseResult,
  dimensionOverride?: WellKnownDimension
): Geometry {
  const geometry: Geometry =
    result.geometry.type === 'GeometryCollection'
      ? {
          type: 'GeometryCollection',
          geometries: (result.children ?? []).map(child => toGeometryWithDimensionMetadata(child))
        }
      : (result.geometry as unknown as Geometry);
  return addDimensionMarker(normalizeEmptyPoints(geometry), dimensionOverride ?? result.dimension);
}

/** Adds a non-enumerable dimension marker used by the WKT writer. */
function addDimensionMarker(geometry: Geometry, dimension?: WellKnownDimension): Geometry {
  if (dimension && dimension !== 'xy') {
    Object.defineProperty(geometry, '__geoarrowDimension', {
      configurable: true,
      enumerable: false,
      value: dimension
    });
  }
  return geometry;
}

/** Separates an optional EWKT SRID prefix and root dimension token. */
function splitWKTHeader(input: string): {
  text: string;
  srid?: string;
  dimension?: WellKnownDimension;
} {
  const sridMatch = input.match(/^\s*SRID=(\d+)\s*;\s*/i);
  const text = sridMatch ? input.slice(sridMatch[0].length) : input;
  const dimensionMatch = text.match(
    /^\s*(?:POINT|LINESTRING|POLYGON|MULTIPOINT|MULTILINESTRING|MULTIPOLYGON|GEOMETRYCOLLECTION)(?:\s+(ZM|Z|M))?(?:\s|\()/i
  );
  const dimensionToken = dimensionMatch?.[1]?.toUpperCase();
  const dimension =
    dimensionToken === 'Z'
      ? 'xyz'
      : dimensionToken === 'M'
        ? 'xym'
        : dimensionToken === 'ZM'
          ? 'xyzm'
          : undefined;
  return {text, srid: sridMatch?.[1], dimension};
}
