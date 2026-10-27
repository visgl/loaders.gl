// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GetTileParameters, TileGrid, TileGridLimits} from '@loaders.gl/core/loader-utils';
import {validateTileGridLimits, resolveTileGridTile} from '@loaders.gl/core/loader-utils/tile-grid';

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
  validateTileGridLimits({...grid, limits: normalized});
  return normalized;
}

/** Checks source coverage using shared canonical-column semantics. */
export function isOGCTileAvailable(
  parameters: GetTileParameters,
  grid: TileGrid | undefined
): boolean {
  return resolveTileGridTile(grid, parameters) !== null;
}
