// loaders.gl, MIT license

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {parseWMSError} from './lib/parsers/wms/parse-wms-error';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type WMSLoaderOptions = LoaderOptions & {
  wms?: {
    /** By default the error loader will throw an error with the parsed error message */
    throwOnError?: boolean;
    /** Do not add any text to errors */
    minimalErrors?: boolean;
  };
};

/**
 * Loader for the response to the WMS GetCapability request
 */
export const WMSErrorLoader = {
  id: 'wms-error',
  name: 'WMS Error',

  module: 'wms',
  version: VERSION,
  worker: false,
  extensions: ['xml'],
  mimeTypes: ['application/vnd.ogc.se_xml', 'application/xml', 'text/xml'],
  testText: testXMLFile,
  options: {
    wms: {
      throwOnError: false
    }
  },
  parse: async (arrayBuffer: ArrayBuffer, options?: WMSLoaderOptions): Promise<string> =>
    parseTextSync(new TextDecoder().decode(arrayBuffer), options),
  parseSync: (arrayBuffer: ArrayBuffer, options?: WMSLoaderOptions): string =>
    parseTextSync(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: WMSLoaderOptions): string => parseTextSync(text, options)
};

function testXMLFile(text: string): boolean {
  // TODO - There could be space first.
  return text.startsWith('<?xml');
}

function parseTextSync(text: string, options?: WMSLoaderOptions): string {
  const wmsOptions: WMSLoaderOptions['wms'] = {...WMSErrorLoader.options.wms, ...options?.wms};
  const error = parseWMSError(text, wmsOptions);
  const message = wmsOptions.minimalErrors ? error : `WMS Service error: ${error}`;
  if (wmsOptions.throwOnError) {
    throw new Error(message);
  }
  return message;
}

export const _typecheckWMSErrorLoader: LoaderWithParser = WMSErrorLoader;
