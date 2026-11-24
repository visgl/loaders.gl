// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parseTWKB, writeTWKB, type WellKnownDimension} from '@math.gl/core/twkb';
import {ensureArrayBuffer} from '../../loader-utils/lib/binary-utils/memory-conversion-utils';
import type {Geometry} from '@loaders.gl/core/schema';

/** Checks the TWKB family nibble in a potential binary payload. */
export function isTWKB(input: ArrayBufferLike): boolean {
  if (input.byteLength < 2) return false;
  const type = new Uint8Array(input, 0, 1)[0] & 15;
  return type >= 1 && type <= 7;
}

/** Decodes a TWKB payload as GeoJSON geometry. */
export function convertTWKBToGeometry(input: ArrayBuffer): Geometry {
  return parseTWKB(input).geometry as Geometry;
}

/** Encodes a geometry using the loader's explicit Z and M options. */
export function convertGeometryToTWKB(
  geometry: Geometry,
  options?: {hasZ?: boolean; hasM?: boolean}
): ArrayBuffer {
  const dimension: WellKnownDimension = options?.hasZ
    ? options.hasM
      ? 'xyzm'
      : 'xyz'
    : options?.hasM
      ? 'xym'
      : 'xy';
  return ensureArrayBuffer(writeTWKB(normalizeGeometry(geometry, dimension), {dimension}));
}

/** Adapts legacy coordinate tuples to the selected TWKB dimension. */
function normalizeGeometry(geometry: Geometry, dimension: WellKnownDimension): Geometry {
  if (geometry.type === 'GeometryCollection') {
    return {
      ...geometry,
      geometries: geometry.geometries.map(child => normalizeGeometry(child, dimension))
    };
  }
  if (!Array.isArray(geometry.coordinates)) throw new Error('unsupported geometry type');
  return {
    ...geometry,
    coordinates: normalizeCoordinates(geometry.coordinates, dimension)
  } as Geometry;
}

/** Visits nested coordinates, retaining the legacy fourth-slot measure when present. */
function normalizeCoordinates(
  coordinates: readonly unknown[],
  dimension: WellKnownDimension
): readonly unknown[] {
  if (!coordinates.length) return coordinates;
  if (typeof coordinates[0] !== 'number') {
    const children = coordinates.map(child =>
      normalizeCoordinates(child as readonly unknown[], dimension)
    );
    return children.every(child => child.length === 0) ? [] : children;
  }
  return Array.from(
    dimension,
    (axis, index) => coordinates[axis === 'm' && coordinates.length === 4 ? 3 : index] ?? 0
  );
}
