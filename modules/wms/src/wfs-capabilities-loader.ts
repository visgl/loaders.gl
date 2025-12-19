// loaders.gl, MIT license

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {WFSCapabilities} from './lib/parsers/wfs/parse-wfs-capabilities';
import {parseWFSCapabilities} from './lib/parsers/wfs/parse-wfs-capabilities';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type {WFSCapabilities};

export type WFSLoaderOptions = LoaderOptions & {
  wfs?: {};
};

/**
 * Loader for the response to the WFS GetCapability request
 * @deprecated Warning: this loader is still experimental and incomplete
 */
export const WFSCapabilitiesLoader = {
  dataType: null as unknown as WFSCapabilities,
  batchType: null as never,

  id: 'wfs-capabilities',
  name: 'WFS Capabilities',

  module: 'wms',
  version: VERSION,
  worker: false,
  extensions: ['xml'],
  mimeTypes: ['application/vnd.ogc.wfs_xml', 'application/xml', 'text/xml'],
  testText: testXMLFile,
  options: {
    wfs: {}
  },
  parse: async (arrayBuffer: ArrayBuffer, options?: WFSLoaderOptions) =>
    parseWFSCapabilities(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: WFSLoaderOptions) => parseWFSCapabilities(text, options)
} as const satisfies LoaderWithParser<WFSCapabilities, never, WFSLoaderOptions>;

function testXMLFile(text: string): boolean {
  // TODO - There could be space first.
  return text.startsWith('<?xml');
}

export const _typecheckWFSCapabilitiesLoader: LoaderWithParser = WFSCapabilitiesLoader;
