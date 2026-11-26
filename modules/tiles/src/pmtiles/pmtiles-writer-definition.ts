// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {PMTilesFormat} from './pmtiles-format';
import type {PMTilesTileInput} from './pmtiles-writer-types';
import type {PMTilesWriterOptions} from './pmtiles-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Shared PMTilesWriter metadata and defaults. */
export const PM_TILES_WRITER_METADATA = {
  ...PMTilesFormat,
  version: VERSION,
  options: {}
} as const satisfies Writer<PMTilesTileInput, never, PMTilesWriterOptions>;

/** Metadata for encoding with PMTilesWriter through the core APIs. */
export const PMTilesWriter = {
  ...PM_TILES_WRITER_METADATA,
  dataType: null as unknown as PMTilesTileInput,
  batchType: null as never,
  options: PM_TILES_WRITER_METADATA.options as PMTilesWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {PMTilesWriter} = await import('./pmtiles-writer.js');
    return PMTilesWriter;
  }
} as const satisfies Writer<PMTilesTileInput, never, PMTilesWriterOptions>;
