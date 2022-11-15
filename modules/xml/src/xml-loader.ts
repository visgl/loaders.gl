import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {SAXParserOptions} from './sax-ts/sax';
import {parseXML} from './lib/parse-xml';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type XMLLoaderOptions = LoaderOptions & {
  xml?: SAXParserOptions;
};

/**
 * Worker loader for the OBJ geometry format
 */
export const XMLLoader = {
  name: 'XML',
  id: 'xml',
  module: 'xml',
  version: VERSION,
  worker: false,
  extensions: ['xml'],
  mimeTypes: ['application/xml', 'text/xml'],
  testText: testXMLFile,
  options: {
    xml: {}
  },
  parse: async (arrayBuffer: ArrayBuffer, options?: XMLLoaderOptions) =>
    parseXML(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: XMLLoaderOptions) => parseXML(text, options)
};

function testXMLFile(text: string): boolean {
  // TODO - There could be space first.
  return text.startsWith('<?xml');
}

export const _typecheckXMLLoader: LoaderWithParser = XMLLoader;
