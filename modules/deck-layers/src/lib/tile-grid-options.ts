// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import type {TileSourceMetadata} from '@loaders.gl/core/loader-utils';

/** Options supported by the default deck.gl XYZ selector. */
export type TileGridLayerOptions = {
  /** Minimum native zoom. */
  minZoom: number;
  /** Maximum native zoom. */
  maxZoom: number;
  /** Logical square tile size. */
  tileSize: number;
};

/** Rejects incompatible complete grids rather than rendering them in unrelated XYZ geometry. */
export function getTileGridLayerOptions(
  metadata?: TileSourceMetadata | null
): TileGridLayerOptions {
  const options = {
    minZoom: metadata?.minZoom ?? 0,
    maxZoom: metadata?.maxZoom ?? 30,
    tileSize: 256
  };
  const set = metadata?.tileGrid?.tileMatrixSet;
  if (!set) return options;
  if (set.crs !== 'EPSG:3857' || !set.matrices.length)
    throw new Error(
      'TileSourceLayer requires canonical Web Mercator XYZ geometry; use a custom tile selector and compatible projection.'
    );
  let previousZoom: number | undefined;
  for (const matrix of set.matrices) {
    const zoom = Math.log2(matrix.matrixSize[0]);
    const size = matrix.tileSize[0];
    const halfWorld = 20037508.342789244;
    if (
      !Number.isInteger(zoom) ||
      zoom < 0 ||
      zoom > 30 ||
      matrix.id !== String(zoom) ||
      matrix.matrixSize[1] !== matrix.matrixSize[0] ||
      matrix.cornerOfOrigin !== 'topLeft' ||
      !Number.isSafeInteger(size) ||
      size <= 0 ||
      size !== matrix.tileSize[1] ||
      (previousZoom !== undefined && (zoom !== previousZoom + 1 || size !== options.tileSize)) ||
      !isClose(matrix.origin[0], -halfWorld) ||
      !isClose(matrix.origin[1], halfWorld) ||
      !isClose(matrix.resolution, (halfWorld * 2) / (size * 2 ** zoom)) ||
      !isClose(matrix.resolutionY ?? matrix.resolution, matrix.resolution)
    ) {
      throw new Error(
        'TileSourceLayer requires contiguous canonical XYZ levels; use a custom tile selector for this grid.'
      );
    }
    if (previousZoom === undefined) options.minZoom = zoom;
    options.maxZoom = zoom;
    options.tileSize = size;
    previousZoom = zoom;
  }
  return options;
}

/** Compares canonical coordinates with a small relative serialization tolerance. */
function isClose(actual: number, expected: number): boolean {
  return Number.isFinite(actual) && Math.abs(actual - expected) <= Math.abs(expected) * 1e-10;
}
