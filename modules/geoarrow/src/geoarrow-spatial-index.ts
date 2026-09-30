// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Vector} from 'apache-arrow';
import {intersectsCoordinate, intersectsExtent} from './lib/geometry-predicates';
import type {GeoArrowEncoding, Geometry} from '@loaders.gl/schema';
import {getGeoArrowRowBounds, type GeoArrowBounds} from './geoarrow-bounds';
import {
  convertGeoArrowVector,
  convertGeoArrowVectorCellToGeoJSON
} from './geoarrow-converter/convert-geoarrow-geometry';

/** Stable application identifier for one row. Numeric and string IDs remain distinct. */
export type GeoArrowFeatureId = string | number | bigint;

/** Nearest geometry result in the input coordinate system. */
export type GeoArrowNearestFeature = {
  /** Row in the indexed vector, usable to retrieve properties from its table. */
  rowIndex: number;
  /** Closest XY coordinate on the geometry (the query point when inside a polygon). */
  coordinate: [number, number];
  /** Euclidean distance in input coordinate units, ignoring Z and M. */
  distance: number;
};

/**
 * Reusable bounds and ID index for a materialized GeoArrow vector.
 *
 * Queries include offscreen rows. Coordinates must share a planar CRS; this class neither
 * reprojects coordinates nor computes geodesic distances. Rebuild after changing the vector.
 * `getFeatureRowsInExtent` uses bounding boxes. Exact coordinate/extent and nearest queries
 * refine candidates against actual geometry. Polygon boundaries, including hole boundaries, match.
 */
export class GeoArrowSpatialIndex {
  /** Geometry vector retained for candidate refinement; callers must not mutate its buffers. */
  private readonly column: Vector;
  /** Declared vector encoding. */
  private readonly encoding: GeoArrowEncoding;
  /** Cached bounds sorted by minimum X for extent pruning. */
  private readonly entries: {rowIndex: number; bounds: GeoArrowBounds}[];
  /** ID lookup preserves duplicate rows and insertion order. */
  private readonly rowsById = new Map<GeoArrowFeatureId, number[]>();

  /** Builds row bounds and optional IDs once. IDs must align with vector rows. */
  constructor(
    column: Vector,
    encoding: GeoArrowEncoding,
    identifiers?: readonly (GeoArrowFeatureId | null)[]
  ) {
    if (identifiers && identifiers.length !== column.length)
      throw new Error('Feature IDs must match the vector length');
    // WKT has no direct buffer bounds kernel; normalize once while preserving row alignment.
    this.column =
      encoding === 'geoarrow.wkt'
        ? convertGeoArrowVector(column, encoding, 'geoarrow.wkb')
        : column;
    this.encoding = encoding === 'geoarrow.wkt' ? 'geoarrow.wkb' : encoding;
    this.entries = [];
    for (const [rowIndex, bounds] of getGeoArrowRowBounds(this.column, this.encoding).entries()) {
      if (bounds) this.entries.push({rowIndex, bounds});
      const identifier = identifiers?.[rowIndex];
      if (identifier !== null && identifier !== undefined) {
        const rows = this.rowsById.get(identifier) || [];
        rows.push(rowIndex);
        this.rowsById.set(identifier, rows);
      }
    }
    this.entries.sort((first, second) => first.bounds[0] - second.bounds[0]);
  }

  /** Returns all rows with the given ID, including rows with null geometry. */
  getFeatureRowsById(identifier: GeoArrowFeatureId): number[] {
    return [...(this.rowsById.get(identifier) || [])];
  }

  /** Returns rows whose XY bounds intersect an extent, including boundary contact, in row order. */
  getFeatureRowsInExtent(extent: GeoArrowBounds): number[] {
    if (!extent.every(Number.isFinite) || extent[0] > extent[2] || extent[1] > extent[3]) {
      throw new Error('Extent must contain finite, ordered XY bounds');
    }
    const rows: number[] = [];
    for (const {rowIndex, bounds} of this.entries) {
      if (bounds[0] > extent[2]) break;
      if (bounds[2] >= extent[0] && bounds[1] <= extent[3] && bounds[3] >= extent[1])
        rows.push(rowIndex);
    }
    return rows.sort((first, second) => first - second);
  }

  /** Returns rows intersecting a coordinate in planar XY, including polygon and line boundaries. */
  getFeatureRowsAtCoordinate(coordinate: readonly [number, number]): number[] {
    if (!coordinate.every(Number.isFinite)) throw new Error('Coordinate must be finite');
    return this.getFeatureRowsInExtent([
      coordinate[0],
      coordinate[1],
      coordinate[0],
      coordinate[1]
    ]).filter(rowIndex => {
      const geometry = convertGeoArrowVectorCellToGeoJSON(this.column, rowIndex, this.encoding);
      return Boolean(geometry && intersectsCoordinate(geometry, coordinate));
    });
  }

  /** Returns rows whose actual geometry intersects a closed extent, excluding bounding-box false positives. */
  getFeatureRowsIntersectingExtent(extent: GeoArrowBounds): number[] {
    return this.getFeatureRowsInExtent(extent).filter(rowIndex => {
      const geometry = convertGeoArrowVectorCellToGeoJSON(this.column, rowIndex, this.encoding);
      return Boolean(geometry && intersectsExtent(geometry, extent));
    });
  }

  /**
   * Finds the closest geometry within an inclusive distance limit, optionally filtering rows.
   * Equal distances select the first row. Empty/null geometries cannot match.
   */
  getClosestFeature(
    coordinate: readonly [number, number],
    options: {
      /** Maximum planar distance. Defaults to infinity. */ maxDistance?: number;
      /** Optional selection predicate, evaluated before geometry decoding. */ filter?: (
        rowIndex: number
      ) => boolean;
    } = {}
  ): GeoArrowNearestFeature | null {
    let bestDistance = options.maxDistance ?? Infinity;
    if (!coordinate.every(Number.isFinite) || Number.isNaN(bestDistance) || bestDistance < 0) {
      throw new Error('Coordinate must be finite and maximum distance nonnegative');
    }
    let result: GeoArrowNearestFeature | null = null;
    for (const {rowIndex, bounds} of this.entries) {
      const distanceToBounds = Math.hypot(
        Math.max(bounds[0] - coordinate[0], 0, coordinate[0] - bounds[2]),
        Math.max(bounds[1] - coordinate[1], 0, coordinate[1] - bounds[3])
      );
      if (distanceToBounds > bestDistance || (options.filter && !options.filter(rowIndex)))
        continue;
      const geometry = convertGeoArrowVectorCellToGeoJSON(this.column, rowIndex, this.encoding);
      const closest = geometry && getClosestCoordinate(geometry, coordinate);
      if (!closest) continue;
      const distance = Math.hypot(closest[0] - coordinate[0], closest[1] - coordinate[1]);
      if (
        distance <= bestDistance &&
        (!result || distance < bestDistance || rowIndex < result.rowIndex)
      ) {
        bestDistance = distance;
        result = {rowIndex, coordinate: closest, distance};
      }
    }
    return result;
  }
}

/** Finds the closest point on a geometry, treating polygon interiors as filled areas. */
function getClosestCoordinate(
  geometry: Geometry,
  coordinate: readonly [number, number]
): [number, number] | null {
  let closest: [number, number] | null = null;
  let distance = Infinity;
  /** Keeps the nearest finite candidate. */
  const considerCoordinate = (candidate: readonly number[] | null): void => {
    if (!candidate) return;
    const candidateDistance = Math.hypot(
      candidate[0] - coordinate[0],
      candidate[1] - coordinate[1]
    );
    if (candidateDistance < distance) {
      distance = candidateDistance;
      closest = [candidate[0], candidate[1]];
    }
  };
  /** Projects the query onto each line segment, including degenerate segments. */
  const considerLine = (positions: number[][]): void => {
    if (positions.length === 1) considerCoordinate(positions[0]);
    for (let index = 1; index < positions.length; index++) {
      const start = positions[index - 1];
      const end = positions[index];
      const deltaX = end[0] - start[0];
      const deltaY = end[1] - start[1];
      const squaredLength = deltaX * deltaX + deltaY * deltaY;
      const fraction = squaredLength
        ? Math.max(
            0,
            Math.min(
              1,
              ((coordinate[0] - start[0]) * deltaX + (coordinate[1] - start[1]) * deltaY) /
                squaredLength
            )
          )
        : 0;
      considerCoordinate([start[0] + fraction * deltaX, start[1] + fraction * deltaY]);
    }
  };
  /** Excludes holes from filled polygon interiors and includes all ring boundaries. */
  const considerPolygon = (rings: number[][][]): void => {
    if (
      rings[0] &&
      isCoordinateInRing(coordinate, rings[0]) &&
      !rings.slice(1).some(ring => isCoordinateInRing(coordinate, ring))
    )
      considerCoordinate(coordinate);
    for (const ring of rings) considerLine(ring);
  };
  switch (geometry.type) {
    case 'Point':
      considerCoordinate(geometry.coordinates);
      break;
    case 'MultiPoint':
      geometry.coordinates.forEach(considerCoordinate);
      break;
    case 'LineString':
      considerLine(geometry.coordinates);
      break;
    case 'MultiLineString':
      geometry.coordinates.forEach(considerLine);
      break;
    case 'Polygon':
      considerPolygon(geometry.coordinates);
      break;
    case 'MultiPolygon':
      geometry.coordinates.forEach(considerPolygon);
      break;
    case 'GeometryCollection':
      for (const member of geometry.geometries)
        considerCoordinate(getClosestCoordinate(member, coordinate));
      break;
  }
  return closest;
}

/** Ray-crossing containment; exact boundary distance is handled by segment projection. */
function isCoordinateInRing(coordinate: readonly [number, number], ring: number[][]): boolean {
  let inside = false;
  for (
    let index = 0, previousIndex = ring.length - 1;
    index < ring.length;
    previousIndex = index++
  ) {
    const current = ring[index];
    const previous = ring[previousIndex];
    if (
      current[1] > coordinate[1] !== previous[1] > coordinate[1] &&
      coordinate[0] <
        ((previous[0] - current[0]) * (coordinate[1] - current[1])) / (previous[1] - current[1]) +
          current[0]
    )
      inside = !inside;
  }
  return inside;
}
