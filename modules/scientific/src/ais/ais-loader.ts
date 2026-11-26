// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table as ArrowTable} from 'apache-arrow';
import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import type {ObjectRowTable} from '@loaders.gl/core/schema';
import {makeMovingObjectTable} from '../moving-objects/moving-object-table';
import {AISLoader as AISLoaderMetadata, type AISLoaderOptions} from './ais-loader-types';
import {parseAISText} from './ais-parser';
import {AIS_COLUMNS} from './ais-schema';

/** Loader metadata for the parser-bearing entrypoint. */
const {preload: _AISLoaderPreload, ...AISLoaderMetadataWithoutPreload} = AISLoaderMetadata;

/** Loader for maritime AIS reports encapsulated as NMEA text. */
export const AISLoaderWithParser = {
  ...AISLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: AISLoaderOptions) =>
    parseAISTextSync(new TextDecoder().decode(arrayBuffer), options),
  parseSync: (arrayBuffer: ArrayBuffer, options?: AISLoaderOptions) =>
    parseAISTextSync(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: parseAISTextSync
} as const satisfies LoaderWithParser<ArrowTable | ObjectRowTable, never, AISLoaderOptions>;

/** Parses AIS text into the requested table shape. */
function parseAISTextSync(text: string, options?: AISLoaderOptions): ArrowTable | ObjectRowTable {
  const formatOptions = {...AISLoaderMetadata.options.ais, ...options?.ais};
  const {rows, invalidRecordCount} = parseAISText(text, formatOptions);
  return makeMovingObjectTable(rows, AIS_COLUMNS, formatOptions.shape, {
    invalidRecordCount: String(invalidRecordCount)
  });
}
