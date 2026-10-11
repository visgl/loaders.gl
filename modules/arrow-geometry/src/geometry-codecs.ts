// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parseWKB, parseWKTWithMetadata, writeWKB, WKBBuilder} from '@math.gl/wkb';
import type {WellKnownDimension, WellKnownGeometry, WKTParseResult} from '@math.gl/wkb';
import type {Feature, Geometry, GeoArrowDimension} from '@loaders.gl/schema';
import {normalizeEmptyPoints} from './geometry-utils';
export {convertGeometryToWKT} from './geometry-to-wkt';
export type {WKTGeometryOptions} from './geometry-to-wkt';

/** Legacy options for a materialized WKT geometry. */
export type ParseWKTOptions = {
  /** WKT-specific output options. */
  wkt?: {
    /** Only materialized GeoJSON geometry is supported. */
    shape?: 'geojson-geometry';
    /** Retain an EWKT SRID as a legacy GeoJSON CRS property. */
    crs?: boolean;
  };
};

/** Legacy WKB dimensional options; SRID was not serialized by this API. */
export type GeometryWKBOptions = {
  /** Include an elevation ordinate. */
  hasZ?: boolean;
  /** Include a measure ordinate. */
  hasM?: boolean;
  /** Retained for compatibility; use math.gl WKBBuilder for EWKB SRIDs. */
  srid?: unknown;
};

/** Parses WKB without copying an input view's byte range and normalizes empty points. */
export function convertWKBToGeometry(input: ArrayBufferLike | ArrayBufferView): Geometry {
  const bytes = ArrayBuffer.isView(input)
    ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
    : new Uint8Array(input);
  return normalizeEmptyPoints(parseWKB(bytes).geometry as Geometry);
}

/** Encodes legacy geometry options with math.gl; collection child markers retain their dimensions. */
export function convertGeometryToWKB(
  input: Geometry | Feature,
  options: GeometryWKBOptions = {}
): ArrayBuffer {
  const geometry = input.type === 'Feature' ? input.geometry : input;
  if (!geometry) throw new Error('WKB writer does not support null feature geometry');
  const dimension: WellKnownDimension = options.hasZ
    ? options.hasM
      ? 'xyzm'
      : 'xyz'
    : options.hasM
      ? 'xym'
      : 'xy';
  const bytes = encodeGeometry(geometry, dimension);
  return bytes.buffer as ArrayBuffer;
}

/** Composes independently encoded collection children; math.gl owns all WKB byte emission. */
function encodeGeometry(geometry: Geometry, dimension: WellKnownDimension): Uint8Array {
  if (geometry.type !== 'GeometryCollection') {
    return writeWKB(geometry as WellKnownGeometry, dimension);
  }
  const children = geometry.geometries.map(child =>
    encodeGeometry(
      child,
      (child as Geometry & {__geoarrowDimension?: WellKnownDimension}).__geoarrowDimension ??
        dimension
    )
  );
  const headerBuilder = new WKBBuilder({mode: 'measure', dimension});
  headerBuilder.beginGeometry('GeometryCollection', children.length);
  const headerLength = headerBuilder.finishGeometry();
  const bytes = new Uint8Array(
    headerLength + children.reduce((total, child) => total + child.length, 0)
  );
  const writer = new WKBBuilder({mode: 'write', target: bytes, dimension});
  writer.beginGeometry('GeometryCollection', children.length);
  let byteOffset = writer.finishGeometry();
  for (const child of children) {
    bytes.set(child, byteOffset);
    byteOffset += child.length;
  }
  return bytes;
}

/** Reads the declared root WKT dimension, retaining the legacy null-on-invalid-header contract. */
export function getWKTDimension(input: string): GeoArrowDimension | null {
  const match = input
    .trim()
    .match(
      /^(?:POINT|LINESTRING|POLYGON|MULTIPOINT|MULTILINESTRING|MULTIPOLYGON|GEOMETRYCOLLECTION)(?:\s+(ZM|Z|M))?(?:\s|\()/i
    );
  if (!match) return null;
  return match[1]?.toUpperCase() === 'Z'
    ? 'xyz'
    : match[1]?.toUpperCase() === 'M'
      ? 'xym'
      : match[1]?.toUpperCase() === 'ZM'
        ? 'xyzm'
        : 'xy';
}

/** Parses WKT with loaders.gl's legacy SRID and invalid-input behavior. */
export function convertWKTToGeometry(input: string, options?: ParseWKTOptions): Geometry | null {
  const {text, srid, dimension} = splitWKTHeader(input);
  try {
    // Preserve the legacy parser's treatment of empty parentheses as invalid input.
    if (/\(\s*\)\s*$/s.test(text)) {
      return null;
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
    if (options?.wkt?.crs && srid !== undefined) {
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
    return null;
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
