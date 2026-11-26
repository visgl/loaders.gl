// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/core/loader-utils';
import encode3DTile from './lib/encoders/encode-3d-tile';
import {TILE3_D_WRITER_METADATA} from './tile-3d-writer-types';

/**
 * Exporter for 3D Tiles
 */
export const Tile3DWriter = {
  ...TILE3_D_WRITER_METADATA,
  encode: async (tile, options) => encodeSync(tile, options),
  encodeSync
} as const satisfies WriterWithEncoder<unknown, never, WriterOptions>;

function encodeSync(tile, options) {
  return encode3DTile(tile, options);
}
