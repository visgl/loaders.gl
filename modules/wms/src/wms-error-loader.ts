// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';

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

/** Preloads the parser-bearing WMS error loader implementation. */
async function preload() {
  const {WMSErrorLoaderWithParser} = await import('./wms-error-loader-with-parser');
  return WMSErrorLoaderWithParser;
}

/** Metadata-only loader for WMS service exception responses. */
export const WMSErrorLoader = {
  dataType: null as unknown as string,
  batchType: null as never,

  id: 'wms-error',
  name: 'WMS Error',

  module: 'wms',
  version: VERSION,
  worker: false,
  text: true,
  extensions: ['xml'],
  mimeTypes: ['application/vnd.ogc.se_xml', 'application/xml', 'text/xml'],
  testText: testXMLFile,
  options: {
    wms: {
      throwOnError: false
    }
  },
  preload
} as const satisfies Loader<string, never, WMSLoaderOptions>;

function testXMLFile(text: string): boolean {
  // TODO - There could be space first.
  return text.startsWith('<?xml');
}
