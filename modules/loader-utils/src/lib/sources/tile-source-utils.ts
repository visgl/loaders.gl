// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GetTileDataBatchResult, GetTileDataParameters, TileSource} from './tile-source';

/**
 * Request tile data in batches when a tile source supports it.
 */
export function getTileDataBatch<T = unknown>(
  source: TileSource,
  parameters: readonly GetTileDataParameters[]
): GetTileDataBatchResult<T> {
  if (source.getTileDataBatch) {
    return source.getTileDataBatch(parameters) as GetTileDataBatchResult<T>;
  }

  return parameters.map(parameter => source.getTileData(parameter) as Promise<T | null>);
}
