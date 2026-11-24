// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {inspectWKTHeader, parseWKB, parseWKTWithMetadata, writeWKB} from '@math.gl/core/arrow';
import {ensureArrayBuffer} from '../loader-utils/lib/binary-utils/memory-conversion-utils';
import type {WellKnownDimension, WellKnownGeometry, WKTParseResult} from '@math.gl/core/arrow';
import type {Feature, Geometry, GeoArrowDimension} from '@loaders.gl/core/schema';
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
  return parseWKB(bytes, {normalizeEmptyPoints: true}).geometry as Geometry;
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
  const bytes = writeWKB(describeGeometry(geometry, dimension));
  return ensureArrayBuffer(bytes);
}

/** Supplies each collection member's effective dimension to the math.gl writer. */
function describeGeometry(geometry: Geometry, dimension: WellKnownDimension): WKTParseResult {
  return {
    geometry: geometry as WellKnownGeometry,
    dimension,
    children:
      geometry.type === 'GeometryCollection'
        ? geometry.geometries.map(child =>
            describeGeometry(
              child,
              (child as Geometry & {__geoarrowDimension?: WellKnownDimension})
                .__geoarrowDimension ?? dimension
            )
          )
        : undefined
  };
}

/** Reads the declared root dimension without parsing the coordinate payload. */
export function getWKTDimension(input: string): GeoArrowDimension | null {
  return inspectWKTHeader(input)?.dimension ?? null;
}

/** Parses WKT with loaders.gl's legacy SRID and invalid-input behavior. */
export function convertWKTToGeometry(input: string, options?: ParseWKTOptions): Geometry | null {
  const dimension = getWKTDimension(input);
  try {
    // Preserve the legacy parser's treatment of empty parentheses as invalid input.
    if (/\(\s*\)\s*$/s.test(input)) return null;

    const collectionHeader =
      /^(\s*(?:SRID\s*=\s*\d+\s*;\s*)?GEOMETRYCOLLECTION)\s+(?:ZM|Z|M)(?=\s|\()/i;
    const parseText = dimension !== 'xym' ? input.replace(collectionHeader, '$1') : input;
    const parsed = parseWKTWithMetadata(parseText, {
      inferDimensions: true,
      allowMissingInheritedOrdinates: true
    });
    const {srid} = parsed;
    const geometry = toGeometryWithDimensionMetadata(
      parsed,
      collectionHeader.test(input) ? (dimension ?? undefined) : undefined
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
