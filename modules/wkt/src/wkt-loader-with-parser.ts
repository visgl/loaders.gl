// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {Geometry} from '@loaders.gl/schema';
import {parseWKT} from '@math.gl/wkb';
import type {WellKnownDimension} from '@math.gl/wkb';
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
    const geometry = normalizeEmptyPoints(parseWKTWithCompatibility(text, dimension));
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
function parseWKTWithCompatibility(text: string, dimension?: WellKnownDimension): Geometry {
  const header = splitWKTHeader(text);
  const normalizedText = header.text;
  const effectiveDimension = dimension ?? header.dimension;
  const geometryCollectionMatch = normalizedText.match(/^\s*GEOMETRYCOLLECTION\s*\((.*)\)\s*$/is);
  if (geometryCollectionMatch) {
    const geometries = splitGeometryCollection(geometryCollectionMatch[1]).map(child =>
      parseWKTWithCompatibility(child)
    );
    return addDimensionMarker({type: 'GeometryCollection', geometries}, effectiveDimension);
  }

  let geometry: Geometry;
  let parsedDimension = effectiveDimension;
  try {
    geometry = parseWKT(normalizedText) as unknown as Geometry;
  } catch (error) {
    const typeMatch = normalizedText.match(
      /^(\s*(?:POINT|LINESTRING|POLYGON|MULTIPOINT|MULTILINESTRING|MULTIPOLYGON|GEOMETRYCOLLECTION))\s*\(/i
    );
    if (!typeMatch) {
      throw error;
    }
    const coordinateText = normalizedText
      .slice(typeMatch[0].length - 1)
      .replace(/^\s*(?:\(\s*)+/, '')
      .match(/^[^,)]+/)?.[0];
    const coordinateCount = coordinateText?.match(
      /[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g
    )?.length;
    const implicitDimension =
      coordinateCount === 3 ? 'Z' : coordinateCount === 4 ? 'ZM' : undefined;
    if (!implicitDimension) {
      throw error;
    }
    parsedDimension = implicitDimension === 'Z' ? 'xyz' : 'xyzm';
    geometry = parseWKT(
      `${typeMatch[1]} ${implicitDimension} ${normalizedText.slice(typeMatch[0].length - 1)}`
    ) as unknown as Geometry;
  }
  return addDimensionMarker(geometry, parsedDimension);
}

/** Splits a geometry collection at commas outside nested coordinate groups. */
function splitGeometryCollection(text: string): string[] {
  const geometries: string[] = [];
  let start = 0;
  let depth = 0;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character === '(') depth++;
    if (character === ')') depth--;
    if (character === ',' && depth === 0) {
      geometries.push(text.slice(start, index).trim());
      start = index + 1;
    }
  }
  const finalGeometry = text.slice(start).trim();
  if (finalGeometry) geometries.push(finalGeometry);
  return geometries;
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
