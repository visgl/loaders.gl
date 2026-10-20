// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createTileGrid, createTileGridMatrix} from '@loaders.gl/core/loader-utils';
import type {TileGrid} from '@loaders.gl/core/loader-utils';
import type {ArcGISMapServerMetadata} from '../arcgis-source-types';

/** Normalizes advertised ArcGIS LODs without inventing dimensions from service coverage. */
export function createArcGISTileGrid(
  tileInfo: ArcGISMapServerMetadata['tileInfo'],
  spatialReference?: unknown
): TileGrid | undefined {
  if (!tileInfo) return undefined;
  const reference = (tileInfo.spatialReference || spatialReference) as
    | {wkid?: number; latestWkid?: number; wkt?: string}
    | undefined;
  const identifier = reference?.latestWkid ?? reference?.wkid;
  const crs =
    identifier === 102100 || identifier === 102113
      ? 'EPSG:3857'
      : identifier !== undefined
        ? `EPSG:${identifier}`
        : reference?.wkt;
  const levels = tileInfo.lods || [];
  if (
    levels.some(level => !Number.isSafeInteger(level.level) || level.level < 0) ||
    new Set(levels.map(level => level.level)).size !== levels.length
  ) {
    throw new Error('ArcGIS tile levels require unique nonnegative integer identifiers');
  }
  const matrices = levels.map(level =>
    createTileGridMatrix({
      id: String(level.level),
      resolution: level.resolution,
      point: tileInfo.origin ? [tileInfo.origin.x, tileInfo.origin.y] : undefined,
      swapAxes: false,
      tileWidth: tileInfo.cols,
      tileHeight: tileInfo.rows
    })
  );
  const grid = createTileGrid(crs, matrices);
  // A service may advertise its grid header without any LODs.
  if (!matrices.length) {
    delete grid.matrices;
    delete grid.matrixIds;
    delete grid.matrixSizes;
    grid.origin = tileInfo.origin ? [tileInfo.origin.x, tileInfo.origin.y] : undefined;
    grid.tileSize =
      tileInfo.cols !== undefined && tileInfo.rows !== undefined
        ? [tileInfo.cols, tileInfo.rows]
        : undefined;
  }
  return grid;
}
