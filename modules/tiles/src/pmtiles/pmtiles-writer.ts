// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterOptions, WriterWithEncoder} from '@loaders.gl/loader-utils';
import {PMTilesFormat} from './pmtiles-format';
import {encodePMTiles} from './lib/encode-pmtiles';
import type {PMTilesEncodeOptions, PMTilesTileInput} from './pmtiles-writer-types';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for packaging already encoded tiles with the standard writer API. */
export type PMTilesWriterOptions = WriterOptions & {
  /** Archive format, metadata, compression declarations and resource budgets. */
  pmtiles?: PMTilesEncodeOptions;
};

/** Bounded, portable PMTiles v3 writer; tile payloads are copied without transcoding. */
export const PMTilesWriter = {
  ...PMTilesFormat,
  version: VERSION,
  options: {},
  encode: (tiles: PMTilesTileInput, options?: PMTilesWriterOptions): Promise<ArrayBuffer> =>
    encodePMTiles(tiles, options?.pmtiles)
} as const satisfies WriterWithEncoder<PMTilesTileInput, never, PMTilesWriterOptions>;
