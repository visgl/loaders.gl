// loaders.gl, MIT license

import type {Loader} from '@loaders.gl/loader-utils';
import type {XMLLoaderOptions} from '@loaders.gl/xml';
// import type {WMTSCapabilities} from './lib/wmts/parse-wmts-capabilities';
import type {WMTSCapabilities} from './lib/wmts/parse-wmts-capabilities';

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
  /** Loads the parser-bearing WMTS capabilities loader implementation. */
  preload: async () => (await import('./wmts-capabilities-loader-with-parser')).WMTSCapabilitiesLoaderWithParser
} as const satisfies Loader<WMTSCapabilities, never, WMTSLoaderOptions>;

function testXMLFile(text: string): boolean {
  // TODO - There could be space first.
  return text.startsWith('<?xml');
}

export const _typecheckWMTSCapabilitiesLoader: Loader = WMTSCapabilitiesLoader;
