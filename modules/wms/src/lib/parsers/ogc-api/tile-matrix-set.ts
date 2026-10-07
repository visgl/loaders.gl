// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TileGrid, TileGridMatrix} from '@loaders.gl/loader-utils';
import {getServiceCRSAxisOrder} from '../../../crs-utils';
import {
  createTileGrid,
  createTileGridMatrix,
  getMetersPerUnit,
  getScaleDenominatorResolution,
  validateMetersPerUnit
} from '../../tile-grid';

/**
 * A CRS reference in an OGC TileMatrixSet 2.0 document: a URI or URN string, or an object with a
 * `uri`. Embedded WKT or PROJJSON definitions are accepted but not interpreted.
 */
export type OGCTileMatrixSetCRS = string | {uri?: string; wkt?: unknown; referenceSystem?: unknown};

/** One tile matrix of an OGC TileMatrixSet 2.0 document (OGC 17-083r4). */
export type OGCTileMatrix = {
  /** Matrix identifier used in tile requests. */
  id: string;
  /** Scale denominator, using the OGC 0.28 mm pixel. */
  scaleDenominator?: number;
  /** CRS units per pixel; preferred over `scaleDenominator` when present. */
  cellSize?: number;
  /** Matrix corner that `pointOfOrigin` locates; defaults to top-left. */
  cornerOfOrigin?: 'topLeft' | 'bottomLeft';
  /** Origin in the CRS axis order given by `orderedAxes`. */
  pointOfOrigin?: number[];
  /** Tile width in pixels. */
  tileWidth?: number;
  /** Tile height in pixels. */
  tileHeight?: number;
  /** Matrix width in tiles. */
  matrixWidth?: number;
  /** Matrix height in tiles. */
  matrixHeight?: number;
  /** Coalesced rows; not interpreted, so tiles in coalesced rows are not described. */
  variableMatrixWidths?: unknown[];
};

/** An OGC TileMatrixSet 2.0 JSON document (OGC 17-083r4). */
export type OGCTileMatrixSet = {
  /** Tile matrix set identifier, such as `WebMercatorQuad`. */
  id?: string;
  /** Human-readable title. */
  title?: string;
  /** Registry URI of a well-known tile matrix set. */
  uri?: string;
  /** Coordinate reference system of every matrix. */
  crs?: OGCTileMatrixSetCRS;
  /** CRS axis names in the order used by `pointOfOrigin`, such as `['Lat', 'Lon']`. */
  orderedAxes?: string[];
  /** Tile matrices, ordered from coarsest to finest. */
  tileMatrices: OGCTileMatrix[];
};

/** Options for converting an OGC TileMatrixSet to a tile grid. */
export type OGCTileMatrixSetOptions = {
  /**
   * Length of one CRS unit in meters, used to convert scale denominators of matrices without a
   * `cellSize`. EPSG:4326, CRS:84 and Web Mercator use their built-in units.
   */
  metersPerUnit?: number | null;
};

/**
 * Converts an OGC TileMatrixSet 2.0 JSON document to the shared tile-grid shape. Origins are
 * returned in XY order with their `cornerOfOrigin`; `cellSize` is used when present, and a scale
 * denominator is converted only when the CRS unit is known.
 */
export function convertOGCTileMatrixSetToTileGrid(
  tileMatrixSet: OGCTileMatrixSet,
  options: OGCTileMatrixSetOptions = {}
): TileGrid {
  if (!Array.isArray(tileMatrixSet?.tileMatrices)) {
    throw new Error('OGC TileMatrixSet requires a tileMatrices array');
  }
  validateMetersPerUnit(options.metersPerUnit, 'OGC TileMatrixSet');
  const crs = getCRSIdentifier(tileMatrixSet.crs);
  const metersPerUnit = getMetersPerUnit(crs, options.metersPerUnit);
  const swapAxes = getAxisOrder(tileMatrixSet.orderedAxes, crs) === 'yx';
  return createTileGrid(
    crs,
    tileMatrixSet.tileMatrices.map(matrix => toTileGridMatrix(matrix, swapAxes, metersPerUnit))
  );
}

/** Converts one tile matrix, keeping only the fields the document provides. */
function toTileGridMatrix(
  matrix: OGCTileMatrix,
  swapAxes: boolean,
  metersPerUnit: number | undefined
): TileGridMatrix {
  if (typeof matrix?.id !== 'string' || !matrix.id) {
    throw new Error('OGC TileMatrixSet tile matrices require a string id');
  }
  return createTileGridMatrix({
    id: matrix.id,
    resolution:
      Number.isFinite(matrix.cellSize) && matrix.cellSize! > 0
        ? matrix.cellSize
        : getScaleDenominatorResolution(matrix.scaleDenominator, metersPerUnit),
    point: matrix.pointOfOrigin,
    swapAxes,
    cornerOfOrigin: matrix.cornerOfOrigin,
    tileWidth: matrix.tileWidth,
    tileHeight: matrix.tileHeight,
    matrixWidth: matrix.matrixWidth,
    matrixHeight: matrix.matrixHeight
  });
}

/** Returns the CRS URI or URN, or undefined for an embedded definition. */
function getCRSIdentifier(crs: OGCTileMatrixSetCRS | undefined): string | undefined {
  if (typeof crs === 'string') return crs;
  return typeof crs?.uri === 'string' ? crs.uri : undefined;
}

/** First-axis names that put the north-south coordinate first, e.g. `Lat`, `Geodetic latitude`, `N`. */
const Y_FIRST_AXIS_NAME = /^(geodetic\s+)?(lat|latitude|n|north|northing|s|south|southing|y)\b/i;

/**
 * Returns the axis order of `pointOfOrigin`. Declared `orderedAxes` win: a first axis naming
 * latitude, northing, southing or Y means the point is written Y first. Otherwise the shared
 * service rule applies.
 */
function getAxisOrder(orderedAxes: string[] | undefined, crs: string | undefined): 'xy' | 'yx' {
  const firstAxis = orderedAxes?.[0];
  if (typeof firstAxis === 'string') {
    return Y_FIRST_AXIS_NAME.test(firstAxis.trim()) ? 'yx' : 'xy';
  }
  return getServiceCRSAxisOrder(crs);
}
