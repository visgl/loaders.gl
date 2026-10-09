// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GetTileParameters, TileGrid, TileGridMatrix} from '@loaders.gl/loader-utils';
import {validateTileMatrix} from '@math.gl/geospatial';
import type {TileMatrix, TileMatrixSet} from '@math.gl/geospatial';

/**
 * Builds a tile grid from advertised per-level metadata. `tileMatrixSet` is set only when every
 * level is complete and valid, and the grid-wide fields are then derived from it. Otherwise the
 * grid-wide fields describe the advertised first level, as before.
 */
export function createTileGrid(crs: string | undefined, matrices: TileGridMatrix[]): TileGrid {
  const tileMatrixSet = getTileMatrixSet(crs, matrices);
  if (tileMatrixSet) {
    const levels = tileMatrixSet.matrices;
    return {
      crs,
      tileSize: [levels[0].tileSize[0], levels[0].tileSize[1]],
      origin: [levels[0].origin[0], levels[0].origin[1]],
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
    origin: matrices[0]?.origin,
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
    cornerOfOrigin: 'topLeft',
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
