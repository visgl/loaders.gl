// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {mergeOptions} from '@loaders.gl/loader-utils';
import {XMLLoaderWithParser, XMLLoaderOptions} from './xml-loader-with-parser';
import {HTMLLoader as HTMLLoaderMetadata} from './html-loader';

const {preload: _HTMLLoaderPreload, ...HTMLLoaderMetadataWithoutPreload} = HTMLLoaderMetadata;

export type HTMLLoaderOptions = XMLLoaderOptions;

/**
 * Loader for HTML files
 * Essentially a copy of the XMLLoaderWithParser with different mime types, file extensions and content tests.
 * This split enables applications can control whether they want HTML responses to be parsed by the XML loader or not.
 * This loader does not have any additional understanding of the structure of HTML or the document.
 */
export const HTMLLoaderWithParser = {
  ...HTMLLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: XMLLoaderOptions) =>
    parseTextSync(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: XMLLoaderOptions) => parseTextSync(text, options)
} as const satisfies LoaderWithParser<any, never, HTMLLoaderOptions>;

function parseTextSync(text: string, options?: XMLLoaderOptions): any {
  // fast-xml-parser can recognize HTML entities
  // https://github.com/NaturalIntelligence/fast-xml-parser/blob/master/docs/v4/2.XMLparseOptions.md#htmlentities
  // https://github.com/NaturalIntelligence/fast-xml-parser/blob/master/docs/v4/5.Entities.md
  options = mergeOptions(options, {
    xml: {
      _parser: 'fast-xml-parser',
      _fastXML: {
        htmlEntities: true
      }
    }
  });

  return XMLLoaderWithParser.parseTextSync?.(text, options);
}
