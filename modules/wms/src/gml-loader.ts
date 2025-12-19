// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {Geometry} from './lib/parsers/gml/parse-gml';
import {parseGML} from './lib/parsers/gml/parse-gml';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type GMLLoaderOptions = LoaderOptions & {
  gml?: {};
};

/**
 * Loader for the response to the GML GetCapability request
 */
export const GMLLoader = {
  dataType: null as unknown as Geometry | null,
  batchType: null as never,

  name: 'GML',
  id: 'gml',

  module: 'wms',
  version: VERSION,
  worker: false,
  extensions: ['xml'],
  mimeTypes: ['application/vnd.ogc.gml', 'application/xml', 'text/xml'],
  testText: testXMLFile,
  options: {
    gml: {}
  },
  parse: async (arrayBuffer: ArrayBuffer, options?: GMLLoaderOptions) =>
    parseGML(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: GMLLoaderOptions) => parseGML(text, options)
} as const satisfies LoaderWithParser<Geometry | null, never, GMLLoaderOptions>;

function testXMLFile(text: string): boolean {
  // TODO - There could be space first.
  return text.startsWith('<?xml');
}
