// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/core/loader-utils';
import {GTFSFormat} from './gtfs-format';
import type {GTFSData} from './gtfs-schema';

/** Version injected at build time. */
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for `GTFSLoader`. */
export type GTFSLoaderOptions = LoaderOptions & {
  /** GTFS Schedule parser options. */
  gtfs?: {
    /**
     * Feed root .txt file names, with optional .txt suffix. Defaults to all root .txt files
     * except stop_times.txt, which often has millions of rows. Name it explicitly to load it.
     * @example `{files: ['stops', 'trips', 'stop_times'], maxRows: 3_000_000}`
     */
    files?: readonly string[];
    /** Maximum rows per file. Default 1,000,000. */
    maxRows?: number;
    /** Maximum compressed and decoded byte length of each selected entry. Default 64 MiB. */
    maxEntryBytes?: number;
  };
};

/** Preloads the parser-bearing GTFS Schedule loader implementation. */
async function preloadGTFSLoader() {
  const {GTFSLoaderWithParser} = await import('@loaders.gl/geospatial/gtfs/bundled');
  return GTFSLoaderWithParser;
}

/** Metadata-only loader for GTFS Schedule ZIP archives. */
export const GTFSLoader = {
  dataType: null as unknown as GTFSData,
  batchType: null as never,

  ...GTFSFormat,
  version: VERSION,
  options: {gtfs: {files: undefined, maxRows: 1_000_000, maxEntryBytes: 64 * 1024 * 1024}},
  preload: preloadGTFSLoader
} as const satisfies Loader<GTFSData, never, GTFSLoaderOptions>;
