// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GetTileParameters, TileGrid, TileGridMatrix} from './tile-source';
import {createTileGrid, getRequestedTileMatrix} from './tile-grid';

/** Half the circumference of the EPSG:3857 projected world, in metres. */
const WEB_MERCATOR_HALF_WORLD = 20037508.342789244;

/**
 * Creates the canonical XYZ world grid for an explicitly established Web Mercator source.
 * `tileSize` defines the logical pixel frame, independently of encoded raster size or vector extent.
 */
export function createWebMercatorTileGrid(
  minZoom: number,
  maxZoom: number,
  tileSize = 256
): TileGrid {
  if (
    !Number.isInteger(minZoom) ||
    !Number.isInteger(maxZoom) ||
    minZoom < 0 ||
    maxZoom < minZoom ||
    maxZoom > 30 ||
    !Number.isSafeInteger(tileSize) ||
    tileSize <= 0
  ) {
    throw new RangeError('XYZ grids require integer zooms 0–30 and a positive integer tile size.');
  }
  return createTileGrid(
    'EPSG:3857',
    Array.from({length: maxZoom - minZoom + 1}, (_, index): TileGridMatrix => {
      const zoom = minZoom + index;
      const count = 2 ** zoom;
      return {
        id: String(zoom),
        resolution: (WEB_MERCATOR_HALF_WORLD * 2) / (tileSize * count),
        origin: [-WEB_MERCATOR_HALF_WORLD, WEB_MERCATOR_HALF_WORLD],
        tileSize: [tileSize, tileSize],
        matrixSize: [count, count]
      };
    })
  );
}

/** Resolves a canonical XYZ matrix identifier/index and rejects coordinates outside its world. */
export function resolveXYZTileParameters(
  grid: TileGrid | undefined,
  parameters: GetTileParameters
): GetTileParameters | null {
  if (!grid?.matrices) {
    if (parameters.tileMatrix !== undefined)
      throw new RangeError('Tile matrix selection requires an established XYZ grid.');
    return parameters;
  }
  const matrix = getRequestedTileMatrix(grid.matrices, level => level.id, parameters);
  if (!matrix) return null;
  const size = matrix.matrixSize;
  const zoom = Number(matrix.id);
  if (
    !size ||
    !Number.isInteger(zoom) ||
    zoom < 0 ||
    zoom > 30 ||
    String(zoom) !== matrix.id ||
    size[0] !== 2 ** zoom ||
    size[1] !== 2 ** zoom
  ) {
    throw new RangeError('XYZ matrices require canonical zoom IDs and world dimensions.');
  }
  if (
    !Number.isSafeInteger(parameters.x) ||
    !Number.isSafeInteger(parameters.y) ||
    parameters.x < 0 ||
    parameters.y < 0 ||
    parameters.x >= size[0] ||
    parameters.y >= size[1]
  )
    return null;
  return {...parameters, z: zoom, tileMatrix: matrix.id};
}
