// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {getXYZTileGridOptions} from '@loaders.gl/core/loader-utils/tile-grid';
import type {TileSourceMetadata} from '@loaders.gl/core/loader-utils';
import type {XYZTileGridOptions} from '@loaders.gl/core/loader-utils/tile-grid';

/** Options supported by the default deck.gl XYZ selector. */
export type TileGridLayerOptions = XYZTileGridOptions;

/** Rejects incompatible complete grids rather than rendering them in unrelated XYZ geometry. */
export function getTileGridLayerOptions(
  metadata?: TileSourceMetadata | null
): TileGridLayerOptions {
  return getXYZTileGridOptions(metadata).options;
}
