// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {XMLLoaderOptions} from '@loaders.gl/xml';
import type {CSWRecords} from './lib/parsers/csw/parse-csw-records';
import {parseCSWRecords} from './lib/parsers/csw/parse-csw-records';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export {CSWRecords};

export type CSWLoaderOptions = XMLLoaderOptions & {
  csw?: {};
};

/**
 * Loader for the response to the CSW GetCapability request
 */
export const CSWRecordsLoader = {
  dataType: null as unknown as CSWRecords,
  batchType: null as never,

  id: 'csw-records',
  name: 'CSW Records',
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
    parseCSWRecords(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: CSWLoaderOptions) => parseCSWRecords(text, options)
} as const satisfies LoaderWithParser<CSWRecords, never, CSWLoaderOptions>;

function testXMLFile(text: string): boolean {
  // TODO - There could be space first.
  return text.startsWith('<?xml');
}
