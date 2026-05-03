// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {XMLLoaderOptions} from '@loaders.gl/xml';
import type {CSWRecords} from './lib/parsers/csw/parse-csw-records';
import {parseCSWRecords} from './lib/parsers/csw/parse-csw-records';
import {CSWRecordsLoader as CSWRecordsLoaderMetadata} from './csw-records-loader';

const {preload: _CSWRecordsLoaderPreload, ...CSWRecordsLoaderMetadataWithoutPreload} =
  CSWRecordsLoaderMetadata;

export {CSWRecords};

export type CSWLoaderOptions = XMLLoaderOptions & {
  csw?: {};
};

/**
 * Loader for the response to the CSW GetCapability request
 */
export const CSWRecordsLoaderWithParser = {
  ...CSWRecordsLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: CSWLoaderOptions) =>
    parseCSWRecords(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: CSWLoaderOptions) => parseCSWRecords(text, options)
} as const satisfies LoaderWithParser<CSWRecords, never, CSWLoaderOptions>;
