// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {XMLLoaderOptions} from '@loaders.gl/xml';
import type {CSWDomain} from './lib/parsers/csw/parse-csw-domain';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type {CSWDomain};

export type CSWLoaderOptions = XMLLoaderOptions & {
  csw?: {};
};

/** Preloads the parser-bearing CSW domain loader implementation. */
async function preload() {
  const {CSWDomainLoaderWithParser} = await import('./csw-domain-loader-with-parser');
  return CSWDomainLoaderWithParser;
}

/** Metadata-only loader for the response to the CSW GetDomain request. */
export const CSWDomainLoader = {
  dataType: null as unknown as CSWDomain,
  batchType: null as never,

  id: 'csw-domain',
  name: 'CSW Domain',

  module: 'wms',
  version: VERSION,
  worker: false,
  text: true,
  extensions: ['xml'],
  mimeTypes: ['application/vnd.ogc.csw_xml', 'application/xml', 'text/xml'],
  testText: testXMLFile,
  options: {
    csw: {}
  },
  preload
} as const satisfies Loader<CSWDomain, never, CSWLoaderOptions>;

function testXMLFile(text: string): boolean {
  // TODO - There could be space first.
  return text.startsWith('<?xml');
}
