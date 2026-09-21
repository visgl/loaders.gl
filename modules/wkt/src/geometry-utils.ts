// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Geometry} from '@loaders.gl/schema';

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
