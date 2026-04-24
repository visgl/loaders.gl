// loaders.gl, MIT license

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {WFSCapabilities} from './lib/parsers/wfs/parse-wfs-capabilities';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type {WFSCapabilities};

export type WFSLoaderOptions = LoaderOptions & {
  wfs?: {};
};

/** Preloads the parser-bearing WFS capabilities loader implementation. */
async function preload() {
  const {WFSCapabilitiesLoaderWithParser} = await import('./wfs-capabilities-loader-with-parser');
  return WFSCapabilitiesLoaderWithParser;
}

/**
 * Metadata-only loader for the response to the WFS GetCapability request
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
  text: true,
  extensions: ['xml'],
  mimeTypes: ['application/vnd.ogc.wfs_xml', 'application/xml', 'text/xml'],
  testText: testXMLFile,
  options: {
    wfs: {}
  },
  preload
} as const satisfies Loader<WFSCapabilities, never, WFSLoaderOptions>;

function testXMLFile(text: string): boolean {
  // TODO - There could be space first.
  return text.startsWith('<?xml');
}

export const _typecheckWFSCapabilitiesLoader: Loader = WFSCapabilitiesLoader;
