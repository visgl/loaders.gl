// loaders.gl, MIT license

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {WCSCapabilities} from './lib/wcs/parse-wcs-capabilities';
import {parseWCSCapabilities} from './lib/wcs/parse-wcs-capabilities';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export {WCSCapabilities};

export type WCSLoaderOptions = LoaderOptions & {
  wcs?: {};
};

/**
 * Loader for the response to the WCS GetCapability request
 */
export const WCSCapabilitiesLoader = {
  dataType: null as unknown as WCSCapabilities,
  batchType: null as never,

  id: 'wcs-capabilities',
  name: 'WFS Capabilities',

  module: 'wms',
  version: VERSION,
  worker: false,
  extensions: ['xml'],
  mimeTypes: ['application/vnd.ogc.wcs_xml', 'application/xml', 'text/xml'],
  testText: testXMLFile,
  options: {
    wms: {}
  },
  parse: async (arrayBuffer: ArrayBuffer, options?: WCSLoaderOptions) =>
    parseWCSCapabilities(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: WCSLoaderOptions) => parseWCSCapabilities(text, options)
} as const satisfies LoaderWithParser<WCSCapabilities, never, WCSLoaderOptions>;

function testXMLFile(text: string): boolean {
  // TODO - There could be space first.
  return text.startsWith('<?xml');
}

export const _typecheckWFSCapabilitiesLoader: LoaderWithParser = WCSCapabilitiesLoader;
