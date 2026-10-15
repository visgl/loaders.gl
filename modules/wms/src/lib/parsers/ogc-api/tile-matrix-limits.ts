// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GetTileParameters, TileGrid, TileGridLimits} from '@loaders.gl/loader-utils';
import {getRequestedTileMatrix} from '../../tile-grid';

/** Inclusive tile availability bounds in an OGC API Tiles tileset document. */
export type OGCTileMatrixLimits = {
  /** Advertised matrix identifier. */
  tileMatrix: string;
  /** First available row, inclusive. */
  minTileRow: number;
  /** Last available row, inclusive. */
  maxTileRow: number;
  /** First available column, inclusive. */
  minTileCol: number;
  /** Last available column, inclusive. */
  maxTileCol: number;
};

/** Converts native OGC limits, preserving the distinction between absent and empty coverage. */
export function convertOGCTileMatrixLimits(
  limits: readonly OGCTileMatrixLimits[] | undefined,
  grid: TileGrid
): TileGridLimits[] | undefined {
  if (limits === undefined) return undefined;
  if (!Array.isArray(limits)) throw new Error('OGC tile matrix limits require an array');
  const normalized = limits.map(limit => ({
    tileMatrix: limit?.tileMatrix,
    minTileRow: limit?.minTileRow,
    maxTileRow: limit?.maxTileRow,
    minTileColumn: limit?.minTileCol,
    maxTileColumn: limit?.maxTileCol
  }));
  validateTileGridLimits(normalized, grid);
  return normalized;
}

/** Validates source coverage independently of complete geometric metadata. */
function validateTileGridLimits(
  limits: readonly TileGridLimits[] | undefined,
  grid: TileGrid
): void {
  if (limits === undefined) return;
  const identifiers = new Set<string>();
  for (const limit of limits) {
    if (
      !limit ||
      typeof limit.tileMatrix !== 'string' ||
      !limit.tileMatrix ||
      identifiers.has(limit.tileMatrix) ||
      ![limit.minTileRow, limit.maxTileRow, limit.minTileColumn, limit.maxTileColumn].every(
        value => Number.isSafeInteger(value) && value >= 0
      ) ||
      limit.minTileRow > limit.maxTileRow ||
      limit.minTileColumn > limit.maxTileColumn
    ) {
      throw new Error('Invalid OGC tile matrix limits');
    }
    identifiers.add(limit.tileMatrix);
    const matrix = grid.matrices?.find(candidate => candidate.id === limit.tileMatrix);
    if (grid.matrices && !matrix)
      throw new Error('OGC tile matrix limits reference an unknown matrix');
    if (
      matrix?.matrixSize &&
      (limit.maxTileColumn >= matrix.matrixSize[0] || limit.maxTileRow >= matrix.matrixSize[1])
    ) {
      throw new Error('OGC tile matrix limits exceed matrix dimensions');
    }
  }
}

/** Checks integer tile indices against advertised dimensions and optional inclusive limits. */
export function isOGCTileAvailable(
  parameters: GetTileParameters,
  grid: TileGrid | undefined
): boolean {
  if (
    ![parameters.x, parameters.y, parameters.z].every(
      value => Number.isSafeInteger(value) && value >= 0
    )
  ) {
    throw new RangeError('OGC tile indices require nonnegative safe integers');
  }
  if (!grid) return true;
  validateTileGridLimits(grid.limits, grid);
  const matrix =
    grid.matrices && getRequestedTileMatrix(grid.matrices, level => level.id, parameters);
  if (grid.matrices && !matrix) return false;
  if (matrix?.matrixSize) {
    if (!matrix.matrixSize.every(size => Number.isSafeInteger(size) && size > 0)) {
      throw new Error('OGC matrix dimensions require positive safe integers');
    }
    if (parameters.x >= matrix.matrixSize[0] || parameters.y >= matrix.matrixSize[1]) return false;
  }
  if (grid.limits === undefined) return true;
  const identifier = matrix?.id ?? parameters.tileMatrix ?? String(parameters.z);
  const limit = grid.limits.find(candidate => candidate.tileMatrix === identifier);
  return Boolean(
    limit &&
      parameters.x >= limit.minTileColumn &&
      parameters.x <= limit.maxTileColumn &&
      parameters.y >= limit.minTileRow &&
      parameters.y <= limit.maxTileRow
  );
}
