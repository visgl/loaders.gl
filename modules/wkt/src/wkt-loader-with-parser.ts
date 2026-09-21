// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {Geometry} from '@loaders.gl/schema';
import {parseWKT} from '@math.gl/wkb';
import type {WellKnownDimension} from '@math.gl/wkb';
import {WKTWorkerLoader as WKTWorkerLoaderMetadata} from './wkt-loader';
import {WKTLoader as WKTLoaderMetadata} from './wkt-loader';
import {normalizeEmptyPoints} from './wkb-loader-with-parser';

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
    const geometry = normalizeEmptyPoints(parseWKTWithCompatibility(text));
    if (dimension && dimension !== 'xy') {
      Object.defineProperty(geometry, '__geoarrowDimension', {
        configurable: true,
        enumerable: false,
        value: dimension
      });
    }
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

/** Parses WKT while accepting legacy untagged 3D and 4D coordinates. */
function parseWKTWithCompatibility(text: string): Geometry {
  try {
    return parseWKT(text) as unknown as Geometry;
  } catch (error) {
    const typeMatch = text.match(
      /^(\s*(?:POINT|LINESTRING|POLYGON|MULTIPOINT|MULTILINESTRING|MULTIPOLYGON|GEOMETRYCOLLECTION))\s*\(/i
    );
    if (!typeMatch) {
      throw error;
    }
    const coordinateText = text
      .slice(typeMatch[0].length - 1)
      .replace(/^\s*(?:\(\s*)+/, '')
      .match(/^[^,)]+/)?.[0];
    const coordinateCount = coordinateText?.match(
      /[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g
    )?.length;
    const dimension = coordinateCount === 3 ? 'Z' : coordinateCount === 4 ? 'ZM' : undefined;
    if (!dimension) {
      throw error;
    }
    return parseWKT(
      `${typeMatch[1]} ${dimension} ${text.slice(typeMatch[0].length - 1)}`
    ) as unknown as Geometry;
  }
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
