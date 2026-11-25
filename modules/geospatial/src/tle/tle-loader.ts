// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table as ArrowTable} from 'apache-arrow';
import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import type {ObjectRowTable} from '@loaders.gl/core/schema';
import {makeOMMTable} from '../omm/omm-schema';
import {TLELoader as TLELoaderMetadata, type TLELoaderOptions} from './tle-loader-types';
import {parseTLEText} from './tle-parser';

export type {TLELoaderOptions} from './tle-loader-types';

const {preload: _TLELoaderPreload, ...TLELoaderMetadataWithoutPreload} = TLELoaderMetadata;

/** Loader for two-line element sets (TLE). It returns rows with the CCSDS OMM keyword names. */
export const TLELoaderWithParser = {
  ...TLELoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: TLELoaderOptions) =>
    parseTLETextSync(new TextDecoder().decode(arrayBuffer), options),
  parseSync: (arrayBuffer: ArrayBuffer, options?: TLELoaderOptions) =>
    parseTLETextSync(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: parseTLETextSync
} as const satisfies LoaderWithParser<ArrowTable | ObjectRowTable, never, TLELoaderOptions>;

/**
 * Parses TLE text into the requested table shape.
 *
 * @param text - TLE text in the two-line or the three-line form.
 * @param options - Loader options.
 * @returns An Apache Arrow table or a loaders.gl object-row table.
 */
function parseTLETextSync(text: string, options?: TLELoaderOptions): ArrowTable | ObjectRowTable {
  const tleOptions = {...TLELoaderMetadata.options.tle, ...options?.tle};
  const rows = parseTLEText(text, {
    validateChecksum: tleOptions.validateChecksum,
    skipInvalidRecords: tleOptions.skipInvalidRecords,
    log: options?.core?.log
  });
  return makeOMMTable(rows, tleOptions.shape);
}
