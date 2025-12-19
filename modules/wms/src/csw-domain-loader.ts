// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {XMLLoaderOptions} from '@loaders.gl/xml';
import type {CSWDomain} from './lib/parsers/csw/parse-csw-domain';
import {parseCSWDomain} from './lib/parsers/csw/parse-csw-domain';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type {CSWDomain};

export type CSWLoaderOptions = XMLLoaderOptions & {
  csw?: {};
};

/**
 * Loader for the response to the CSW GetCapability request
 */
export const CSWDomainLoader = {
  dataType: null as unknown as CSWDomain,
  batchType: null as never,

  id: 'csw-domain',
  name: 'CSW Domain',

  module: 'wms',
  version: VERSION,
  worker: false,
  extensions: ['xml'],
  mimeTypes: ['application/vnd.ogc.csw_xml', 'application/xml', 'text/xml'],
  testText: testXMLFile,
  options: {
    csw: {}
  },
  parse: async (arrayBuffer: ArrayBuffer, options?: CSWLoaderOptions) =>
    parseCSWDomain(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: CSWLoaderOptions) => parseCSWDomain(text, options)
} as const satisfies LoaderWithParser<CSWDomain, never, CSWLoaderOptions>;

function testXMLFile(text: string): boolean {
  // TODO - There could be space first.
  return text.startsWith('<?xml');
}
