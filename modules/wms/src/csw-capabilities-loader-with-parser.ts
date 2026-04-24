// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {XMLLoaderOptions} from '@loaders.gl/xml';
import type {CSWCapabilities} from './lib/parsers/csw/parse-csw-capabilities';
import {parseCSWCapabilities} from './lib/parsers/csw/parse-csw-capabilities';
import {CSWCapabilitiesLoader as CSWCapabilitiesLoaderMetadata} from './csw-capabilities-loader';

const {preload: _CSWCapabilitiesLoaderPreload, ...CSWCapabilitiesLoaderMetadataWithoutPreload} =
  CSWCapabilitiesLoaderMetadata;

// parsed data type
export type {CSWCapabilities};

/** CSW loader options */
export type CSWLoaderOptions = XMLLoaderOptions & {
  csw?: {};
};

/**
 * Loader for the response to the CSW GetCapability request
 */
export const CSWCapabilitiesLoaderWithParser = {
  ...CSWCapabilitiesLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: CSWLoaderOptions) =>
    parseCSWCapabilities(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: CSWLoaderOptions) => parseCSWCapabilities(text, options)
} as const satisfies LoaderWithParser<CSWCapabilities, never, CSWLoaderOptions>;
