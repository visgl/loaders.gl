import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {parseWMSCapabilities} from './lib/parse-wms-capabilities';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type WMSCapabilitiesLoaderOptions = LoaderOptions & {
  wms?: {};
};

/**
 * Worker loader for the OBJ geometry format
 */
export const WMSCapabilitiesLoader = {
  name: 'WMS Capabilities',
  id: 'wms',
  module: 'wms',
  version: VERSION,
  worker: false,
  extensions: ['xml'],
  mimeTypes: ['application/vnd.ogc.wms_xml', 'application/xml', 'text/xml'],
  testText: testXMLFile,
  options: {
    obj: {}
  },
  parse: async (arrayBuffer: ArrayBuffer, options?: WMSCapabilitiesLoaderOptions) =>
    parseWMSCapabilities(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: WMSCapabilitiesLoaderOptions) =>
    parseWMSCapabilities(text, options)
};

function testXMLFile(text: string): boolean {
  // TODO - There could be space first.
  return text.startsWith('<?xml');
}

export const _typecheckWMSCapabilitiesLoader: LoaderWithParser = WMSCapabilitiesLoader;
