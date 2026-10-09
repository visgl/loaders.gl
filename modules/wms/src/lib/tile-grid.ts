// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GetTileParameters, TileGrid, TileGridMatrix} from '@loaders.gl/loader-utils';
import {validateTileMatrix} from '@math.gl/geospatial';
import type {TileMatrix, TileMatrixSet} from '@math.gl/geospatial';
import {getServiceCRSMetersPerUnit} from '../crs-utils';

/** OGC standardized rendering pixel size, used to convert scale denominators: 0.28 mm. */
export const OGC_PIXEL_SIZE_METERS = 0.00028;

/**
 * Builds a tile grid from advertised per-level metadata. `tileMatrixSet` is set only when every
 * level is complete and valid, and the grid-wide fields are then derived from it. Otherwise the
 * grid-wide fields describe the advertised first level, and the aligned `resolutions` and
 * `matrixSizes` arrays are set only when every level has a value.
 */
export function createTileGrid(crs: string | undefined, matrices: TileGridMatrix[]): TileGrid {
  const tileMatrixSet = getTileMatrixSet(crs, matrices);
  if (tileMatrixSet) {
    const levels = tileMatrixSet.matrices;
    return {
      crs,
      tileSize: [levels[0].tileSize[0], levels[0].tileSize[1]],
      // The grid-wide origin is documented as top-left, so a bottom-left origin is per-level only.
      origin:
        levels[0].cornerOfOrigin === 'topLeft'
          ? [levels[0].origin[0], levels[0].origin[1]]
          : undefined,
      resolutions: levels.map(matrix => matrix.resolution),
      matrixIds: levels.map(matrix => matrix.id),
      matrixSizes: levels.map(matrix => [matrix.matrixSize[0], matrix.matrixSize[1]]),
      tileMatrixSet,
      matrices
    };
  }
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

/** Returns complete geometry for every level, or undefined when any level is incomplete or invalid. */
function getTileMatrixSet(
  crs: string | undefined,
  matrices: TileGridMatrix[]
): TileMatrixSet | undefined {
  if (!crs || !matrices.length) return undefined;
  const tileMatrices: TileMatrix[] = [];
  for (const matrix of matrices) {
    const tileMatrix = toTileMatrix(matrix);
    if (!tileMatrix) return undefined;
    tileMatrices.push(tileMatrix);
  }
  return {crs, matrices: tileMatrices};
}

/** Converts one advertised level to math.gl geometry, or null when it is incomplete or invalid. */
function toTileMatrix(matrix: TileGridMatrix): TileMatrix | null {
  const {id, resolution, origin, tileSize, matrixSize} = matrix;
  if (resolution === undefined || !origin || !tileSize || !matrixSize) return null;
  const tileMatrix: TileMatrix = {
    id,
    resolution,
    origin: [origin[0], origin[1]],
    cornerOfOrigin: matrix.cornerOfOrigin ?? 'topLeft',
    tileSize: [tileSize[0], tileSize[1]],
    matrixSize: [matrixSize[0], matrixSize[1]]
  };
  try {
    validateTileMatrix(tileMatrix);
  } catch {
    return null;
  }
  return tileMatrix;
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
 * Returns the matrix a tile request addresses. An explicit `tileMatrix` identifier is matched
 * exactly and throws when the set does not contain it. Without one, `z` selects the matrix whose
 * identifier is that number, otherwise the matrix at index `z`, without rounding or clamping.
 */
export function getRequestedTileMatrix<MatrixT>(
  matrices: readonly MatrixT[],
  getId: (matrix: MatrixT) => string,
  parameters: Pick<GetTileParameters, 'z' | 'tileMatrix'>
): MatrixT | undefined {
  if (parameters.tileMatrix !== undefined) {
    const matrix = matrices.find(candidate => getId(candidate) === parameters.tileMatrix);
    if (!matrix) throw new RangeError(`Unknown tile matrix "${parameters.tileMatrix}"`);
    return matrix;
  }
  return matrices.find(matrix => getId(matrix) === String(parameters.z)) || matrices[parameters.z];
}

/**
 * Returns the matrix identifier for an integer zoom: the matrix whose id is that number, otherwise
 * the matrix at that array index, as WMTS requests do. Undefined when neither exists.
 */
export function getTileGridMatrixId(
  tileGrid: TileGrid | undefined,
  zoom: number
): string | undefined {
  const matrices = tileGrid?.matrices || [];
  return (matrices.find(matrix => matrix.id === String(zoom)) || matrices[zoom])?.id;
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
