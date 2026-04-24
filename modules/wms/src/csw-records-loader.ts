// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {XMLLoaderOptions} from '@loaders.gl/xml';
import type {CSWRecords} from './lib/parsers/csw/parse-csw-records';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export {CSWRecords};

export type CSWLoaderOptions = XMLLoaderOptions & {
  csw?: {};
};

/** Preloads the parser-bearing CSW records loader implementation. */
async function preload() {
  const {CSWRecordsLoaderWithParser} = await import('./csw-records-loader-with-parser');
  return CSWRecordsLoaderWithParser;
}

/** Metadata-only loader for the response to the CSW GetRecords request. */
export const CSWRecordsLoader = {
  dataType: null as unknown as CSWRecords,
  batchType: null as never,

  id: 'csw-records',
  name: 'CSW Records',
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
} as const satisfies Loader<CSWRecords, never, CSWLoaderOptions>;

function testXMLFile(text: string): boolean {
  // TODO - There could be space first.
  return text.startsWith('<?xml');
}
