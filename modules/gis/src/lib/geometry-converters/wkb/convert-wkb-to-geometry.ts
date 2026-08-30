// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parseWKB} from '@math.gl/wkb';
import type {Geometry} from '@loaders.gl/schema';

/** Legacy options retained for API compatibility. */
export type convertWKBOptions = {
  /** Does the GeoJSON input have Z values? */
  hasZ?: boolean;
  /** Does the GeoJSON input have M values? */
  hasM?: boolean;
  /** Spatial reference for input GeoJSON. */
  srid?: unknown;
};

/**
 * Converts a WKB geometry into a GeoJSON geometry.
 *
 * Parsing and defensive input validation are provided by the Arrow-independent
 * `@math.gl/wkb` codec. OGC empty points are normalized to loaders.gl's empty tuple form.
 */
export function convertWKBToGeometry(arrayBuffer: ArrayBufferLike): Geometry {
  const geometry = parseWKB(new Uint8Array(arrayBuffer)).geometry as Geometry;
  return normalizeEmptyPoints(geometry);
}

function normalizeEmptyPoints(geometry: Geometry): Geometry {
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
