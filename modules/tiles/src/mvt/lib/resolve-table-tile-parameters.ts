// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import type {GetTileParameters} from '@loaders.gl/core/loader-utils';

/** Resolves a generated table tiler's native numeric level ID before tiling or coordinate conversion. */
export function resolveTableTileParameters(
  parameters: GetTileParameters,
  maxZoom: number
): GetTileParameters {
  if (parameters.signal?.aborted) throw new DOMException('The operation was aborted', 'AbortError');
  if (parameters.tileMatrix === undefined) return parameters;
  const zoom = Number(parameters.tileMatrix);
  if (
    !Number.isInteger(zoom) ||
    zoom < 0 ||
    zoom > maxZoom ||
    String(zoom) !== parameters.tileMatrix
  ) {
    throw new RangeError(`Unknown table tile matrix "${parameters.tileMatrix}"`);
  }
  return {...parameters, z: zoom};
}
