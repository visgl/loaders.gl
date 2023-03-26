// loaders.gl, MIT license

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
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
};

function testXMLFile(text: string): boolean {
  // TODO - There could be space first.
  return text.startsWith('<?xml');
}

export const _typecheckGMLLoader: LoaderWithParser = GMLLoader;
