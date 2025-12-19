// loaders.gl, MIT license

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {XMLLoaderOptions} from '@loaders.gl/xml';
// import type {WMTSCapabilities} from './lib/wmts/parse-wmts-capabilities';
import {parseWMTSCapabilities, WMTSCapabilities} from './lib/wmts/parse-wmts-capabilities';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

// export type {WMTSCapabilities};

export type WMTSLoaderOptions = XMLLoaderOptions & {
  wmts?: {};
};

/**
 * Loader for the response to the WMTS GetCapability request
 */
export const WMTSCapabilitiesLoader = {
  dataType: null as unknown as WMTSCapabilities,
  batchType: null as never,

  id: 'wmts-capabilities',
  name: 'WMTS Capabilities',

  module: 'wms',
  version: VERSION,
  worker: false,
  extensions: ['xml'],
  mimeTypes: ['application/vnd.ogc.wmts_xml', 'application/xml', 'text/xml'],
  testText: testXMLFile,
  options: {
    wms: {}
  },
  parse: async (arrayBuffer: ArrayBuffer, options?: WMTSLoaderOptions) =>
    parseWMTSCapabilities(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: WMTSLoaderOptions) => parseWMTSCapabilities(text, options)
} as const satisfies LoaderWithParser<WMTSCapabilities, never, WMTSLoaderOptions>;

function testXMLFile(text: string): boolean {
  // TODO - There could be space first.
  return text.startsWith('<?xml');
}

export const _typecheckWMTSCapabilitiesLoader: LoaderWithParser = WMTSCapabilitiesLoader;
