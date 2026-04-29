// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ParseXMLOptions} from './lib/parsers/parse-xml';
import {parseXMLSync} from './lib/parsers/parse-xml';
import {XMLLoader as XMLLoaderMetadata} from './xml-loader';

const {preload: _XMLLoaderPreload, ...XMLLoaderMetadataWithoutPreload} = XMLLoaderMetadata;

export type XMLLoaderOptions = LoaderOptions & {
  xml?: ParseXMLOptions;
};

/**
 * Loader for XML files
 */
export const XMLLoaderWithParser = {
  ...XMLLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: XMLLoaderOptions) =>
    parseXMLSync(new TextDecoder().decode(arrayBuffer), {
      ...XMLLoaderWithParser.options.xml,
      ...options?.xml
    }),
  parseTextSync: (text: string, options?: XMLLoaderOptions) =>
    parseXMLSync(text, {...XMLLoaderWithParser.options.xml, ...options?.xml})
} as const satisfies LoaderWithParser<any, never, XMLLoaderOptions>;
