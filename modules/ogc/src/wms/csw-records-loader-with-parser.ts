// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import type {XMLLoaderOptions} from '@loaders.gl/documents';
import type {CSWRecords} from './lib/parsers/csw/parse-csw-records';
import {parseCSWRecords} from './lib/parsers/csw/parse-csw-records';
import {CSWRecordsLoader as CSWRecordsLoaderMetadata} from './csw-records-loader';

const {preload: _CSWRecordsLoaderPreload, ...CSWRecordsLoaderMetadataWithoutPreload} =
  CSWRecordsLoaderMetadata;

export {CSWRecords};

export type CSWRecordsLoaderOptions = XMLLoaderOptions & {
  csw?: {};
};

/**
 * Loader for the response to the CSW GetCapability request
 */
export const CSWRecordsLoaderWithParser = {
  ...CSWRecordsLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: CSWRecordsLoaderOptions) =>
    parseCSWRecords(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: CSWRecordsLoaderOptions) => parseCSWRecords(text, options)
} as const satisfies LoaderWithParser<CSWRecords, never, CSWRecordsLoaderOptions>;
