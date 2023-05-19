// loaders.gl, MIT license

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {XMLLoaderOptions} from '@loaders.gl/xml';
import {parseWMSCapabilities} from './lib/parsers/wms/parse-wms-capabilities';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

// Parsed data types
export type {
  WMSCapabilities,
  WMSLayer,
  WMSBoundingBox,
  WMSDimension,
  WMSRequest,
  WMSExceptions
} from './lib/parsers/wms/parse-wms-capabilities';

export type WMSCapabilitiesLoaderOptions = XMLLoaderOptions & {
  wms?: {
    /** Add inherited layer information to sub layers */
    inheritedLayerProps?: boolean;
    /** Include the "raw" JSON (parsed but untyped, unprocessed XML). May contain additional fields */
    includeRawData?: boolean;
    /** Include the original XML document text. May contain additional information. */
    includeXMLText?: boolean;
    /** @deprecated Use options.includeRawData` */
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
  parse: async (arrayBuffer: ArrayBuffer, options?: WMSCapabilitiesLoaderOptions) =>
    // TODO pass in XML options
    parseWMSCapabilities(new TextDecoder().decode(arrayBuffer), options?.wms),
  parseTextSync: (text: string, options?: WMSCapabilitiesLoaderOptions) =>
    // TODO pass in XML options
    parseWMSCapabilities(text, options?.wms)
};

function testXMLFile(text: string): boolean {
  // TODO - There could be space first.
  return text.startsWith('<?xml');
}

export const _typecheckWMSCapabilitiesLoader: LoaderWithParser = WMSCapabilitiesLoader;
