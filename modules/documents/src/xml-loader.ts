// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import type {XMLLoaderOptions} from './xml-loader-types';
import {parseXMLSync} from './lib/parsers/parse-xml';
import {XMLLoader as XMLLoaderMetadata} from './xml-loader-types';

const {preload: _XMLLoaderPreload, ...XMLLoaderMetadataWithoutPreload} = XMLLoaderMetadata;

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
