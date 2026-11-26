// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterOptions, WriterWithEncoder} from '@loaders.gl/core/loader-utils';
import {encodePMTiles} from './lib/encode-pmtiles';
import type {PMTilesEncodeOptions, PMTilesTileInput} from './pmtiles-writer-types';
import {PM_TILES_WRITER_METADATA} from './pmtiles-writer-definition';

/** Options for packaging already encoded tiles with the standard writer API. */
export type PMTilesWriterOptions = WriterOptions & {
  /** Archive format, metadata, compression declarations and resource budgets. */
  pmtiles?: PMTilesEncodeOptions;
};

/** Bounded, portable PMTiles v3 writer; tile payloads are copied without transcoding. */
export const PMTilesWriter = {
  ...PM_TILES_WRITER_METADATA,
  encode: (tiles: PMTilesTileInput, options?: PMTilesWriterOptions): Promise<ArrayBuffer> =>
    encodePMTiles(tiles, options?.pmtiles)
} as const satisfies WriterWithEncoder<PMTilesTileInput, never, PMTilesWriterOptions>;
