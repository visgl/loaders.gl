// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TileGrid, TileGridMatrix} from '@loaders.gl/loader-utils';
import {getServiceCRSMetersPerUnit} from '../crs-utils';

/** OGC standardized rendering pixel size, used to convert scale denominators: 0.28 mm. */
export const OGC_PIXEL_SIZE_METERS = 0.00028;

/**
 * Builds a tile grid from per-level matrices. The grid-wide fields describe the first level, and
 * the aligned `resolutions` and `matrixSizes` arrays are set only when every level has a value.
 */
export function createTileGrid(crs: string | undefined, matrices: TileGridMatrix[]): TileGrid {
  return {
    crs,
    tileSize: matrices[0]?.tileSize,
    // The grid-wide origin is documented as top-left, so a bottom-left origin is per-level only.
    origin: matrices[0]?.cornerOfOrigin === 'bottomLeft' ? undefined : matrices[0]?.origin,
    ...(matrices.length && matrices.every(matrix => matrix.resolution !== undefined)
      ? {resolutions: matrices.map(matrix => matrix.resolution!)}
      : {}),
    matrixIds: matrices.map(matrix => matrix.id),
    matrixSizes: matrices.every(matrix => matrix.matrixSize)
      ? matrices.map(matrix => matrix.matrixSize!)
      : undefined,
    matrices
  };
}

/** Advertised fields of one tile matrix, in the service's own axis order. */
export type TileMatrixFields = {
  id: string;
  resolution?: number;
  /** Origin as advertised; swapped to XY when `swapAxes` is set. */
  point?: number[];
  swapAxes: boolean;
  cornerOfOrigin?: 'topLeft' | 'bottomLeft';
  tileWidth?: number;
  tileHeight?: number;
  matrixWidth?: number;
  matrixHeight?: number;
};

/** Builds one tile-grid level, keeping only the fields the service advertises. */
export function createTileGridMatrix(fields: TileMatrixFields): TileGridMatrix {
  const {point, tileWidth, tileHeight} = fields;
  const tileGridMatrix: TileGridMatrix = {id: fields.id};
  if (fields.resolution !== undefined) tileGridMatrix.resolution = fields.resolution;
  if (point && point.length >= 2) {
    tileGridMatrix.origin = fields.swapAxes ? [point[1], point[0]] : [point[0], point[1]];
  }
  if (String(fields.cornerOfOrigin).toLowerCase() === 'bottomleft') {
    tileGridMatrix.cornerOfOrigin = 'bottomLeft';
  }
  if (tileWidth) tileGridMatrix.tileSize = [tileWidth, tileHeight || tileWidth];
  if (fields.matrixWidth !== undefined && fields.matrixHeight !== undefined) {
    tileGridMatrix.matrixSize = [fields.matrixWidth, fields.matrixHeight];
  }
  return tileGridMatrix;
}

/**
 * Returns the length of one CRS unit in meters. Built-in units always win; the caller's value
 * applies only to other CRSs. Without either, the result is undefined, so no resolution is guessed.
 */
export function getMetersPerUnit(
  crs: string | undefined,
  metersPerUnit: number | null | undefined
): number | undefined {
  return getServiceCRSMetersPerUnit(crs) ?? metersPerUnit ?? undefined;
}

/** Converts an OGC scale denominator to CRS units per pixel, or undefined when it cannot. */
export function getScaleDenominatorResolution(
  scaleDenominator: number | undefined,
  metersPerUnit: number | undefined
): number | undefined {
  return metersPerUnit && Number.isFinite(scaleDenominator) && scaleDenominator! > 0
    ? (scaleDenominator! * OGC_PIXEL_SIZE_METERS) / metersPerUnit
    : undefined;
}

/** Rejects a `metersPerUnit` option that is set but not a positive finite number. */
export function validateMetersPerUnit(
  metersPerUnit: number | null | undefined,
  serviceName: string
): void {
  if (metersPerUnit === undefined || metersPerUnit === null) return;
  if (!Number.isFinite(metersPerUnit) || metersPerUnit <= 0)
    throw new RangeError(`${serviceName} metersPerUnit must be a positive finite number`);
}
