// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import {GTFSLoader as GTFSLoaderMetadata, type GTFSLoaderOptions} from './gtfs-loader-types';
import {parseGTFS} from './gtfs-parser';
import type {GTFSData} from './gtfs-schema';

/** Loader metadata for the parser-bearing entrypoint. */
const {preload: _GTFSLoaderPreload, ...GTFSLoaderMetadataWithoutPreload} = GTFSLoaderMetadata;

/** Loader for GTFS Schedule ZIP archives. */
export const GTFSLoaderWithParser = {
  ...GTFSLoaderMetadataWithoutPreload,
  parse: (arrayBuffer: ArrayBuffer, options?: GTFSLoaderOptions) =>
    parseGTFS(arrayBuffer, {
      files: options?.gtfs?.files,
      maxRows: options?.gtfs?.maxRows ?? GTFSLoaderMetadata.options.gtfs.maxRows,
      maxEntryBytes: options?.gtfs?.maxEntryBytes ?? GTFSLoaderMetadata.options.gtfs.maxEntryBytes
    })
} as const satisfies LoaderWithParser<GTFSData, never, GTFSLoaderOptions>;
