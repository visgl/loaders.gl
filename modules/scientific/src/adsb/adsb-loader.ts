// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table as ArrowTable} from 'apache-arrow';
import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import type {ObjectRowTable} from '@loaders.gl/core/schema';
import {makeMovingObjectTable} from '../moving-objects/moving-object-table';
import {ADSBLoader as ADSBLoaderMetadata, type ADSBLoaderOptions} from './adsb-loader-types';
import {parseADSBText} from './adsb-parser';
import {ADSB_COLUMNS} from './adsb-schema';

/** Loader metadata for the parser-bearing entrypoint. */
const {preload: _ADSBLoaderPreload, ...ADSBLoaderMetadataWithoutPreload} = ADSBLoaderMetadata;

/** Loader for ADS-B aircraft state JSON snapshots. */
export const ADSBLoaderWithParser = {
  ...ADSBLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: ADSBLoaderOptions) =>
    parseADSBTextSync(new TextDecoder().decode(arrayBuffer), options),
  parseSync: (arrayBuffer: ArrayBuffer, options?: ADSBLoaderOptions) =>
    parseADSBTextSync(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: parseADSBTextSync
} as const satisfies LoaderWithParser<ArrowTable | ObjectRowTable, never, ADSBLoaderOptions>;

/** Parses ADSB text into the requested table shape. */
function parseADSBTextSync(text: string, options?: ADSBLoaderOptions): ArrowTable | ObjectRowTable {
  const formatOptions = {...ADSBLoaderMetadata.options.adsb, ...options?.adsb};
  const rows = parseADSBText(text);
  return makeMovingObjectTable(rows, ADSB_COLUMNS, formatOptions.shape);
}
