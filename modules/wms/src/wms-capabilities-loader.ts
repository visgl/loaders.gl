// loaders.gl, MIT license

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {WMSCapabilities} from './lib/parsers/wms/parse-wms-capabilities';
import {parseWMSCapabilities} from './lib/parsers/wms/parse-wms-capabilities';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

// Parsed data type
export type {WMSCapabilities};

export type WMSLoaderOptions = LoaderOptions & {
  wms?: {
    /** Add inherited layer information to sub layers */
    inheritedLayerProps?: boolean;
    /** Whether to include "raw" XML-derived JSON */
    raw?: boolean;
  };
};

/**
 * Loader for the response to the WMS GetCapability request
 */
export const WMSCapabilitiesLoader = {
  id: 'wms-capabilities',
  name: 'WMS Capabilities',

  module: 'wms',
  version: VERSION,
  worker: false,
  extensions: ['xml'],
  mimeTypes: ['application/vnd.ogc.wms_xml', 'application/xml', 'text/xml'],
  testText: testXMLFile,
  options: {
    wms: {}
  },
  parse: async (arrayBuffer: ArrayBuffer, options?: WMSLoaderOptions) =>
    parseWMSCapabilities(new TextDecoder().decode(arrayBuffer), options?.wms),
  parseTextSync: (text: string, options?: WMSLoaderOptions) =>
    parseWMSCapabilities(text, options?.wms)
};

function testXMLFile(text: string): boolean {
  // TODO - There could be space first.
  return text.startsWith('<?xml');
}

export const _typecheckWMSCapabilitiesLoader: LoaderWithParser = WMSCapabilitiesLoader;
