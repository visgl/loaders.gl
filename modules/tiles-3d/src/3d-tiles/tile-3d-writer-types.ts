// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {WriterOptions, Writer} from '@loaders.gl/core/loader-utils';
import {VERSION} from './lib/utils/version';

/** Shared Tile3DWriter metadata and defaults. */
export const TILE3_D_WRITER_METADATA = {
  name: '3D Tile',
  id: '3d-tiles',
  module: 'tiles-3d',
  version: VERSION,
  extensions: ['cmpt', 'pnts', 'b3dm', 'i3dm'],
  mimeTypes: ['application/octet-stream'],
  binary: true,
  options: {
    ['3d-tiles']: {}
  }
} as const satisfies Writer<unknown, never, WriterOptions>;

/** Metadata for encoding with Tile3DWriter through the core APIs. */
export const Tile3DWriter = {
  ...TILE3_D_WRITER_METADATA,
  dataType: null as unknown,
  batchType: null as never,
  options: TILE3_D_WRITER_METADATA.options as WriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {Tile3DWriter} = await import('./tile-3d-writer.js');
    return Tile3DWriter;
  }
} as const satisfies Writer<unknown, never, WriterOptions>;
