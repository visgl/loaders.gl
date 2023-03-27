// loaders.gl, MIT license

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {XMLLoaderOptions} from '@loaders.gl/xml';
import type {CSWCapabilities} from './lib/parsers/csw/parse-csw-capabilities';
import {parseCSWCapabilities} from './lib/parsers/csw/parse-csw-capabilities';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

// parsed data type
export type {CSWCapabilities};

/** CSW loader options */
export type CSWLoaderOptions = XMLLoaderOptions & {
  csw?: {};
};

/**
 * Loader for the response to the CSW GetCapability request
 */
export const CSWCapabilitiesLoader = {
  id: 'csw-capabilities',
  name: 'CSW Capabilities',

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
    parseCSWCapabilities(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: CSWLoaderOptions) => parseCSWCapabilities(text, options)
};

function testXMLFile(text: string): boolean {
  // TODO - There could be space first.
  return text.startsWith('<?xml');
}

export const _typecheckCSWCapabilitiesLoader: LoaderWithParser = CSWCapabilitiesLoader;
