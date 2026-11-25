// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table as ArrowTable} from 'apache-arrow';
import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import type {ObjectRowTable} from '@loaders.gl/core/schema';
import {OMMLoader as OMMLoaderMetadata, type OMMLoaderOptions} from './omm-loader-types';
import {parseOMMText} from './omm-parser';
import {makeOMMTable} from './omm-schema';

export type {OMMLoaderOptions} from './omm-loader-types';

const {preload: _OMMLoaderPreload, ...OMMLoaderMetadataWithoutPreload} = OMMLoaderMetadata;

/** Loader for CCSDS OMM (Orbit Mean-Elements Message) data in the JSON or the KVN form. */
export const OMMLoaderWithParser = {
  ...OMMLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: OMMLoaderOptions) =>
    parseOMMTextSync(new TextDecoder().decode(arrayBuffer), options),
  parseSync: (arrayBuffer: ArrayBuffer, options?: OMMLoaderOptions) =>
    parseOMMTextSync(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: parseOMMTextSync
} as const satisfies LoaderWithParser<ArrowTable | ObjectRowTable, never, OMMLoaderOptions>;

/**
 * Parses OMM text into the requested table shape.
 *
 * @param text - OMM document in the JSON or the KVN form.
 * @param options - Loader options.
 * @returns An Apache Arrow table or a loaders.gl object-row table.
 */
function parseOMMTextSync(text: string, options?: OMMLoaderOptions): ArrowTable | ObjectRowTable {
  const ommOptions = {...OMMLoaderMetadata.options.omm, ...options?.omm};
  const rows = parseOMMText(text, {
    skipInvalidRecords: ommOptions.skipInvalidRecords,
    log: options?.core?.log
  });
  return makeOMMTable(rows, ommOptions.shape);
}
