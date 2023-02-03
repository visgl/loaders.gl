// loaders.gl, MIT license

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {parseWFSCapabilities} from '../lib/wfs/parse-wfs';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type WFSLoaderOptions = LoaderOptions & {
  wfs?: {};
};

/**
 * Loader for the response to the WFS GetCapability request
 */
export const WFSCapabilitiesLoader = {
  id: 'wfs-capabilities',
  name: 'WFS Capabilities',

  module: 'wms',
  version: VERSION,
  worker: false,
  extensions: ['xml'],
  mimeTypes: ['application/vnd.ogc.wfs_xml', 'application/xml', 'text/xml'],
  testText: testXMLFile,
  options: {
    wms: {}
  },
  parse: async (arrayBuffer: ArrayBuffer, options?: WFSLoaderOptions) =>
    parseWFSCapabilities(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: WFSLoaderOptions) => parseWFSCapabilities(text, options)
};

function testXMLFile(text: string): boolean {
  // TODO - There could be space first.
  return text.startsWith('<?xml');
}

export const _typecheckWFSCapabilitiesLoader: LoaderWithParser = WFSCapabilitiesLoader;
