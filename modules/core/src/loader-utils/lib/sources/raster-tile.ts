// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GetRasterTileParameters, NumericRasterData, RasterSource} from './raster-source';
import {resolveTileGridTile} from './tile-grid';
import {waitForPromiseWithSignal} from '../request-utils/abort-utils';

/**
 * Reads one native tile without resampling (experimental).
 * Uses the advertised matrix IDs for default bands and lets the source validate explicit bands.
 */
export async function readRasterTile(
  source: RasterSource<NumericRasterData>,
  parameters: GetRasterTileParameters
): Promise<NumericRasterData | null> {
  const {tileMatrix, bands, signal} = parameters;
  signal?.throwIfAborted();
  const {tileGrid, nativeTileMatrixIds} = await waitForPromiseWithSignal(
    source.getMetadata({signal}),
    signal
  );
  signal?.throwIfAborted();
  const matrixSet = tileGrid?.tileMatrixSet;
  if (!matrixSet?.crs || !matrixSet.matrices.length)
    throw new Error('readRasterTile requires a complete native tile matrix set');

  const resolved = resolveTileGridTile(tileGrid, {...parameters, z: 0});
  const matrix = matrixSet.matrices.find(candidate => candidate.id === tileMatrix)!;
  if (bands === undefined && nativeTileMatrixIds && !nativeTileMatrixIds.includes(tileMatrix))
    throw new Error(
      `Tile matrix "${tileMatrix}" does not support native tile reads. Readable matrix IDs: ${JSON.stringify(nativeTileMatrixIds)}`
    );
  if (!resolved) return null;
  if (!source.getRasterTile) throw new Error('Raster source does not support native tile reads');

  const raster = await waitForPromiseWithSignal(
    source.getRasterTile({...parameters, x: resolved.x}),
    signal
  );
  signal?.throwIfAborted();
  if (!raster) return null;
  if (raster.width !== matrix.tileSize[0] || raster.height !== matrix.tileSize[1])
    throw new Error(`Raster tile dimensions do not match matrix "${tileMatrix}"`);
  return raster;
}
