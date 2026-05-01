// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {XMLLoaderOptions} from '@loaders.gl/xml';
import type {CSWCapabilities} from './lib/parsers/csw/parse-csw-capabilities';

import {CSWCapabilitiesFormat} from './wms-format';
// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

// parsed data type
export type {CSWCapabilities};

/** CSW loader options */
export type CSWLoaderOptions = XMLLoaderOptions & {
  csw?: {};
};

/** Preloads the parser-bearing CSW capabilities loader implementation. */
async function preload() {
  const {CSWCapabilitiesLoaderWithParser} = await import('./csw-capabilities-loader-with-parser');
  return CSWCapabilitiesLoaderWithParser;
}

/** Metadata-only loader for the response to the CSW GetCapability request. */
export const CSWCapabilitiesLoader = {
  ...CSWCapabilitiesFormat,
  dataType: null as unknown as CSWCapabilities,
  batchType: null as never,

  id: 'csw-capabilities',
  name: 'CSW Capabilities',
  module: 'wms',
  version: VERSION,
  worker: false,
  encoding: 'xml',
  format: 'csw-capabilities',
  text: true,
  extensions: ['xml'],
  mimeTypes: ['application/vnd.ogc.csw_xml', 'application/xml', 'text/xml'],
  testText: testXMLFile,
  options: {
    csw: {}
  },
  preload
} as const satisfies Loader<CSWCapabilities, never, CSWLoaderOptions>;

function testXMLFile(text: string): boolean {
  // TODO - There could be space first.
  return text.startsWith('<?xml');
}
