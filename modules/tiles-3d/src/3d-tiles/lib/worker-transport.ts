// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {Tiles3DTilesetJSONPostprocessed} from '../types';

/**
 * Removes the deprecated parser reference from normalized tilesets before a worker transfer.
 * Render-content results do not contain the reference and pass through unchanged.
 */
export function serialize3DTilesWorkerResult(result: unknown): unknown {
  if (!isTilesetResult(result)) {
    return result;
  }
  const {loader: _loader, ...serializedResult} = result;
  return serializedResult;
}

/** Restores the main-thread loader reference after a normalized tileset crosses a worker boundary. */
export function deserialize3DTilesWorkerResult(result: unknown, loader: Loader): any {
  return isTilesetResult(result) ? {...result, loader} : result;
}

/** Returns whether a parser result is a normalized 3D Tiles tileset. */
function isTilesetResult(result: unknown): result is Tiles3DTilesetJSONPostprocessed {
  return Boolean(
    result &&
      typeof result === 'object' &&
      (result as Tiles3DTilesetJSONPostprocessed).shape === 'tileset3d'
  );
}
