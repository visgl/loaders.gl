// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import {XMLLoaderWithParser} from './xml-loader';
import type {XMLLoaderOptions} from './xml-loader-types';
import {HTMLLoader as HTMLLoaderMetadata} from './html-loader-types';

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

/** Applies tolerant HTML defaults while honoring explicit native XML options. */
function parseTextSync(text: string, options?: XMLLoaderOptions): any {
  return XMLLoaderWithParser.parseTextSync(text, {
    ...options,
    xml: {strict: false, htmlEntities: true, ...options?.xml}
  });
}
