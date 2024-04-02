// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ParseXMLOptions} from './lib/parsers/parse-xml';
import {parseXMLSync} from './lib/parsers/parse-xml';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type XMLLoaderOptions = LoaderOptions & {
  xml?: ParseXMLOptions;
};

/**
 * Loader for XML files
 */
export const XMLLoader = {
  dataType: null as any,
  batchType: null as never,
  name: 'XML',
  id: 'xml',
  module: 'xml',
  version: VERSION,
  worker: false,
  extensions: ['xml'],
  mimeTypes: ['application/xml', 'text/xml'],
  testText: testXMLFile,
  options: {
    xml: {
      _parser: 'fast-xml-parser',
      uncapitalizeKeys: false,
      removeNSPrefix: false,
      textNodeName: 'value',
      arrayPaths: []
    }
  },
  parse: async (arrayBuffer: ArrayBuffer, options?: XMLLoaderOptions) =>
    parseXMLSync(new TextDecoder().decode(arrayBuffer), {
      ...XMLLoader.options.xml,
      ...options?.xml
    }),
  parseTextSync: (text: string, options?: XMLLoaderOptions) =>
    parseXMLSync(text, {...XMLLoader.options.xml, ...options?.xml})
} as const satisfies LoaderWithParser<any, never, XMLLoaderOptions>;

function testXMLFile(text: string): boolean {
  // TODO - There could be space first.
  return text.startsWith('<?xml');
}
