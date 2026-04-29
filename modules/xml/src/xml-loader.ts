// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ParseXMLOptions} from './lib/parsers/parse-xml';
import {XMLFormat} from './xml-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type XMLLoaderOptions = LoaderOptions & {
  xml?: ParseXMLOptions;
};

/** Preloads the parser-bearing XML loader implementation. */
async function preload() {
  const {XMLLoaderWithParser} = await import('./xml-loader-with-parser');
  return XMLLoaderWithParser;
}

/**
 * Metadata-only loader for XML files.
 */
export const XMLLoader = {
  dataType: null as any,
  batchType: null as never,
  ...XMLFormat,
  version: VERSION,
  worker: false,
  testText: testXMLFile,
  options: {
    xml: {
      _parser: 'fast-xml-parser',
      uncapitalizeKeys: false,
      removeNSPrefix: false,
      textNodeName: 'value',
      arrayPaths: []
    }
  },
  preload
} as const satisfies Loader<any, never, XMLLoaderOptions>;

function testXMLFile(text: string): boolean {
  // TODO - There could be space first.
  return text.startsWith('<?xml');
}
