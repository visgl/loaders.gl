// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {XMLLoaderOptions} from '@loaders.gl/xml';
import type {CSWDomain} from './lib/parsers/csw/parse-csw-domain';
import {parseCSWDomain} from './lib/parsers/csw/parse-csw-domain';
import {CSWDomainLoader as CSWDomainLoaderMetadata} from './csw-domain-loader';

const {preload: _CSWDomainLoaderPreload, ...CSWDomainLoaderMetadataWithoutPreload} =
  CSWDomainLoaderMetadata;

export type {CSWDomain};

export type CSWLoaderOptions = XMLLoaderOptions & {
  csw?: {};
};

/**
 * Loader for the response to the CSW GetCapability request
 */
export const CSWDomainLoaderWithParser = {
  ...CSWDomainLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: CSWLoaderOptions) =>
    parseCSWDomain(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: CSWLoaderOptions) => parseCSWDomain(text, options)
} as const satisfies LoaderWithParser<CSWDomain, never, CSWLoaderOptions>;
