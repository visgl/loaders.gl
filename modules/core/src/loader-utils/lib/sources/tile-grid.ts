// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GetTileParameters, TileGrid, TileGridMatrix, TileGridLimits} from './tile-source';
import {getTileBounds, getTileRanges, validateTileMatrix} from '@math.gl/geospatial/tile-matrix';
import type {TileMatrix, TileMatrixSet, VariableMatrixWidth} from '@math.gl/geospatial/tile-matrix';

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
  if (new Set(matrices.map(matrix => matrix.id)).size !== matrices.length) return undefined;
  const tileMatrices: TileMatrix[] = [];
  for (const matrix of matrices) {
    const tileMatrix = toTileMatrix(matrix);
    if (!tileMatrix) return undefined;
    tileMatrices.push(tileMatrix);
  }
  return {crs, matrices: tileMatrices};
}

/** Converts one advertised level to math.gl geometry, or null when it is incomplete or invalid. */
function toTileMatrix(matrix: TileGridMatrix | TileMatrix): TileMatrix | null {
  const {id, resolution, resolutionY, origin, tileSize, matrixSize} = matrix;
  if (matrix.variableMatrixWidths !== undefined && !Array.isArray(matrix.variableMatrixWidths))
    return null;
  if (resolution === undefined || !origin || !tileSize || !matrixSize) return null;
  const tileMatrix: TileMatrix = {
    id,
    resolution,
    ...(resolutionY !== undefined ? {resolutionY} : {}),
    origin: [origin[0], origin[1]],
    cornerOfOrigin: matrix.cornerOfOrigin === undefined ? 'topLeft' : matrix.cornerOfOrigin,
    tileSize: [tileSize[0], tileSize[1]],
    matrixSize: [matrixSize[0], matrixSize[1]],
    ...(matrix.variableMatrixWidths !== undefined
      ? {variableMatrixWidths: matrix.variableMatrixWidths}
      : {})
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
  /** Advertised matrix identifier. */
  id: string;
  /** Coordinate units per pixel, when known. */
  resolution?: number;
  /** Vertical coordinate units per pixel; defaults to the horizontal resolution. */
  resolutionY?: number;
  /** Origin as advertised; swapped to XY when `swapAxes` is set. */
  point?: number[];
  /** Whether the advertised coordinates are Y first. */
  swapAxes: boolean;
  /** Corner located by the origin; defaults to top-left. */
  cornerOfOrigin?: 'topLeft' | 'bottomLeft';
  /** Advertised tile width in pixels. */
  tileWidth?: number;
  /** Advertised tile height in pixels. */
  tileHeight?: number;
  /** Advertised matrix width in tiles. */
  matrixWidth?: number;
  /** Advertised matrix height in tiles. */
  matrixHeight?: number;
  /** Coalescence bands in native row numbering, unaffected by coordinate axis swapping. */
  variableMatrixWidths?: readonly VariableMatrixWidth[];
};

/** Builds one tile-grid level, keeping only the fields the service advertises. */
export function createTileGridMatrix(fields: TileMatrixFields): TileGridMatrix {
  const {point, tileWidth, tileHeight} = fields;
  const tileGridMatrix: TileGridMatrix = {id: fields.id};
  if (fields.resolution !== undefined) tileGridMatrix.resolution = fields.resolution;
  if (fields.resolutionY !== undefined) tileGridMatrix.resolutionY = fields.resolutionY;
  if (point && point.length >= 2) {
    tileGridMatrix.origin = fields.swapAxes ? [point[1], point[0]] : [point[0], point[1]];
  }
  if (String(fields.cornerOfOrigin).toLowerCase() === 'bottomleft') {
    tileGridMatrix.cornerOfOrigin = 'bottomLeft';
  }
  if (tileWidth !== undefined && tileHeight !== undefined) {
    tileGridMatrix.tileSize = [tileWidth, tileHeight];
  }
  if (fields.matrixWidth !== undefined && fields.matrixHeight !== undefined) {
    tileGridMatrix.matrixSize = [fields.matrixWidth, fields.matrixHeight];
  }
  if (fields.variableMatrixWidths !== undefined) {
    tileGridMatrix.variableMatrixWidths = fields.variableMatrixWidths;
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
 * Returns the `{tileMatrix}` identifier for a request. With a known grid, the requested matrix
 * must exist in it (see `getRequestedTileMatrix()`); a missing one throws instead of falling back
 * to `z`. Without a grid, the explicit identifier is used verbatim, otherwise `z`.
 */
export function getTileGridMatrixId(
  tileGrid: TileGrid | undefined,
  parameters: Pick<GetTileParameters, 'z' | 'tileMatrix'>
): string {
  if (tileGrid) validateTileGrid(tileGrid);
  const matrices = tileGrid?.tileMatrixSet?.matrices ?? tileGrid?.matrices;
  if (!matrices) return parameters.tileMatrix ?? String(parameters.z);
  const matrix = getRequestedTileMatrix<TileMatrix | TileGridMatrix>(
    matrices,
    level => level.id,
    parameters
  );
  if (!matrix) throw new RangeError(`No tile matrix for z ${parameters.z}`);
  return matrix.id;
}

/** Read-only geometry/metadata/coverage accepted by shared validation and request helpers. */
export type TileGridValidationInput = Pick<TileGrid, 'crs' | 'tileMatrixSet'> & {
  /** Advertised levels, used only when authoritative complete geometry is absent. */
  matrices?: readonly TileGridMatrix[];
  /** Inclusive source coverage in base-grid indices. */
  limits?: readonly TileGridLimits[];
};

/** A reason that a grid cannot provide complete, unambiguous geometry or coverage. */
export type TileGridValidationIssue = {
  /** Stable category; missing fields describe partial metadata, other categories are invalid. */
  code:
    | 'missing-crs'
    | 'missing-geometry'
    | 'invalid-matrix'
    | 'duplicate-matrix-id'
    | 'invalid-limits';
  /** Native matrix identifier when the issue belongs to one level. */
  tileMatrix?: string;
  /** Human-readable explanation, including underlying math.gl validation when available. */
  message: string;
};

/** Validation result; partial metadata is preserved and is distinct from invalid metadata. */
export type TileGridValidation = {
  /** Complete means authoritative geometry is present and valid, including coverage. */
  status: 'complete' | 'partial' | 'invalid';
  /** Diagnostics in matrix order, followed by coverage diagnostics. */
  issues: TileGridValidationIssue[];
};

/** Inspects authoritative geometry or advertised partial levels without mutating the grid. */
export function getTileGridValidation(grid: TileGridValidationInput): TileGridValidation {
  const issues: TileGridValidationIssue[] = [];
  const matrixSet = grid.tileMatrixSet;
  const coordinateReferenceSystem = matrixSet ? matrixSet.crs : grid.crs;
  if (typeof coordinateReferenceSystem !== 'string' || !coordinateReferenceSystem)
    issues.push({code: 'missing-crs', message: 'Tile grid requires a CRS for complete geometry.'});
  const matrices = matrixSet ? matrixSet.matrices : grid.matrices;
  if (!matrixSet)
    issues.push({code: 'missing-geometry', message: 'Tile grid has no complete tile matrix set.'});
  const identifiers = new Set<string>();
  if ((matrixSet || matrices !== undefined) && !Array.isArray(matrices))
    issues.push({code: 'invalid-matrix', message: 'Tile matrices require an array.'});
  for (const matrix of Array.isArray(matrices) ? matrices : []) {
    if (!matrix || typeof matrix.id !== 'string' || !matrix.id) {
      issues.push({
        code: 'invalid-matrix',
        message: 'Tile matrices require nonempty string identifiers.'
      });
      continue;
    }
    if (identifiers.has(matrix.id))
      issues.push({
        code: 'duplicate-matrix-id',
        tileMatrix: matrix.id,
        message: 'Tile matrix identifiers must be unique.'
      });
    identifiers.add(matrix.id);
    try {
      if (matrix.variableMatrixWidths !== undefined && !Array.isArray(matrix.variableMatrixWidths))
        throw new RangeError('Variable-width rows require an array.');
      if (matrixSet) {
        validateTileMatrix(matrix as TileMatrix);
      } else {
        for (const value of [matrix.resolution, matrix.resolutionY]) {
          if (value !== undefined && (!Number.isFinite(value) || value <= 0))
            throw new RangeError('Resolution must be positive and finite.');
        }
        for (const dimensions of [matrix.tileSize, matrix.matrixSize]) {
          if (
            dimensions !== undefined &&
            (dimensions.length !== 2 ||
              !dimensions.every(value => Number.isSafeInteger(value) && value > 0))
          )
            throw new RangeError('Matrix and tile dimensions require two positive safe integers.');
        }
        if (
          matrix.origin !== undefined &&
          (matrix.origin.length !== 2 || !matrix.origin.every(Number.isFinite))
        )
          throw new RangeError('Origin requires two finite coordinates.');
        if (
          matrix.cornerOfOrigin !== undefined &&
          !['topLeft', 'bottomLeft'].includes(matrix.cornerOfOrigin)
        )
          throw new RangeError('Invalid origin corner.');
        if (
          matrix.resolution !== undefined &&
          matrix.origin &&
          matrix.tileSize &&
          matrix.matrixSize
        ) {
          if (!toTileMatrix(matrix))
            throw new RangeError('Invalid tile matrix geometry or variable-width rows.');
        } else {
          const missingFields = (
            ['resolution', 'origin', 'tileSize', 'matrixSize'] as const
          ).filter(field => matrix[field] === undefined);
          issues.push({
            code: 'missing-geometry',
            tileMatrix: matrix.id,
            message: `Incomplete tile matrix geometry: missing ${missingFields.join(', ')}.`
          });
        }
      }
    } catch (error) {
      issues.push({
        code: 'invalid-matrix',
        tileMatrix: matrix.id,
        message: error instanceof Error ? error.message : 'Invalid tile matrix geometry.'
      });
    }
  }
  try {
    validateTileGridLimits(grid);
  } catch (error) {
    issues.push({
      code: 'invalid-limits',
      message: error instanceof Error ? error.message : 'Invalid tile grid limits.'
    });
  }
  const invalid = issues.some(
    issue => issue.code !== 'missing-crs' && issue.code !== 'missing-geometry'
  );
  return {status: invalid ? 'invalid' : issues.length ? 'partial' : 'complete', issues};
}

/** Rejects invalid geometry/identity/coverage while allowing advertised partial metadata. */
export function validateTileGrid(grid: TileGridValidationInput): void {
  const result = getTileGridValidation(grid);
  if (result.status === 'invalid')
    throw new RangeError(
      result.issues
        .filter(issue => issue.code !== 'missing-crs' && issue.code !== 'missing-geometry')
        .map(issue => issue.message)
        .join(' ')
    );
  if (grid.tileMatrixSet && result.status !== 'complete')
    throw new RangeError('Complete tile matrix geometry requires a CRS.');
}

/** Validates inclusive base-grid coverage even when resolution or CRS is unknown. */
export function validateTileGridLimits(grid: TileGridValidationInput): void {
  if (grid.limits === undefined) return;
  if (!Array.isArray(grid.limits)) throw new RangeError('Tile matrix limits require an array.');
  const identifiers = new Set<string>();
  const matrices = grid.tileMatrixSet?.matrices ?? grid.matrices;
  for (const limit of grid.limits) {
    if (
      !limit ||
      typeof limit.tileMatrix !== 'string' ||
      !limit.tileMatrix ||
      identifiers.has(limit.tileMatrix) ||
      ![limit.minTileColumn, limit.maxTileColumn, limit.minTileRow, limit.maxTileRow].every(
        value => Number.isSafeInteger(value) && value >= 0
      ) ||
      limit.minTileColumn > limit.maxTileColumn ||
      limit.minTileRow > limit.maxTileRow
    )
      throw new RangeError('Invalid tile matrix limits.');
    identifiers.add(limit.tileMatrix);
    const matrix = matrices?.find(candidate => candidate.id === limit.tileMatrix);
    if (matrices && !matrix)
      throw new RangeError('Tile matrix limits reference an unknown matrix.');
    if (
      matrix?.matrixSize &&
      (limit.maxTileColumn >= matrix.matrixSize[0] || limit.maxTileRow >= matrix.matrixSize[1])
    )
      throw new RangeError('Tile matrix limits exceed matrix dimensions.');
  }
}

/**
 * Resolves a native tile request, or null outside geometry/coverage. Coalesced aliases resolve
 * to one canonical base column if any alias is covered. Complete geometry is required for
 * coalesced requests; ordinary partial grids retain dimension/limit-only addressing.
 */
export function resolveTileGridTile<
  ParametersT extends Pick<GetTileParameters, 'x' | 'y' | 'z' | 'tileMatrix'>
>(
  grid: TileGridValidationInput | undefined,
  parameters: ParametersT
):
  | (Omit<ParametersT, 'x' | 'tileMatrix'> & {
      /** Canonical native base column; may differ from the input alias. */
      x: number;
      /** Resolved matrix identifier when grid metadata is known. */
      tileMatrix?: string;
    })
  | null {
  if (
    ![parameters.x, parameters.y, parameters.z].every(
      value => Number.isSafeInteger(value) && value >= 0
    )
  )
    throw new RangeError('Tile indices require nonnegative safe integers.');
  if (!grid) return parameters;
  validateTileGrid(grid);
  const matrices = grid.tileMatrixSet?.matrices ?? grid.matrices;
  const matrix =
    matrices &&
    getRequestedTileMatrix<TileMatrix | TileGridMatrix>(matrices, level => level.id, parameters);
  if (matrices && !matrix) return null;
  const tileMatrix = matrix?.id ?? parameters.tileMatrix ?? String(parameters.z);
  const limits = grid.limits?.find(limit => limit.tileMatrix === tileMatrix);
  if (grid.limits !== undefined && !limits) return null;
  if (
    matrix?.matrixSize &&
    (parameters.x >= matrix.matrixSize[0] || parameters.y >= matrix.matrixSize[1])
  )
    return null;
  if (matrix && grid.tileMatrixSet) {
    const geometry = matrix as TileMatrix;
    const ranges = getTileRanges(
      geometry,
      getTileBounds(geometry, parameters.x, parameters.y),
      limits
    );
    if (!ranges.length) return null;
    return {...parameters, x: ranges[0].minTileColumn, tileMatrix};
  }
  if (matrix?.variableMatrixWidths?.length)
    throw new RangeError('Coalesced tile requests require complete geometry.');
  if (
    limits &&
    (parameters.x < limits.minTileColumn ||
      parameters.x > limits.maxTileColumn ||
      parameters.y < limits.minTileRow ||
      parameters.y > limits.maxTileRow)
  )
    return null;
  return {...parameters, tileMatrix};
}
