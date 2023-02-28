import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {SAXParserOptions} from './sax-ts/sax';
import {fastParseXML, FastXMLParserOptions} from './lib/parsers/parse-xml';
import {uncapitalizeKeys} from './lib/xml-utils/uncapitalize';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type XMLLoaderOptions = LoaderOptions & {
  xml?: {
    // TODO - type this harder
    parser?: 'fast-xml-parser' | string;
    /** XML is typically PascalCase, JavaScript prefects camelCase */
    uncapitalizeKeys?: boolean;
    removeNSPrefix?: boolean;
    textNodeName?: string;
    arrayPaths?: string[];
  };
  /** @deprecated Experimental, passes options to fast-xml-parser, IF it is being used */
  _fastXML?: FastXMLParserOptions;
  /** @deprecated Experimental, passes options to the SAX XML parser, IF it is being used. */
  _sax?: SAXParserOptions;
};

/**
 * Loader for XML files
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
    xml: {
      parser: 'fast-xml-parser',
      uncapitalizeKeys: false,
      removeNSPrefix: false,
      textNodeName: 'value',
      arrayPaths: []
    }
  },
  parse: async (arrayBuffer: ArrayBuffer, options?: XMLLoaderOptions) =>
    parseTextSync(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: XMLLoaderOptions) => parseTextSync(text, options)
};

function testXMLFile(text: string): boolean {
  // TODO - There could be space first.
  return text.startsWith('<?xml');
}

function parseTextSync(text: string, options?: XMLLoaderOptions): any {
  const xmlOptions: Required<XMLLoaderOptions['xml']> = {...XMLLoader.options.xml, ...options?.xml};
  switch (xmlOptions.parser) {
    case 'fast-xml-parser':
      const fastXMLOptions: FastXMLParserOptions = {
        // Default FastXML options
        // https://github.com/NaturalIntelligence/fast-xml-parser/blob/master/docs/v4/2.XMLparseOptions.md#allowbooleanattributes
        allowBooleanAttributes: true,
        // https://github.com/NaturalIntelligence/fast-xml-parser/blob/master/docs/v4/2.XMLparseOptions.md#ignoredeclaration
        ignoreDeclaration: true,

        // XMLLoader Options: Map to FastXMLOptions

        // https://github.com/NaturalIntelligence/fast-xml-parser/blob/master/docs/v4/2.XMLparseOptions.md#removensprefix
        removeNSPrefix: xmlOptions.removeNSPrefix,

        // https://github.com/NaturalIntelligence/fast-xml-parser/blob/master/docs/v4/2.XMLparseOptions.md#textnodename
        textNodeName: xmlOptions.textNodeName,

        isArray: (name: string, jpath: string, isLeafNode: boolean, isAttribute: boolean) => {
          const array = Boolean(xmlOptions?.arrayPaths?.some((path) => jpath === path));
          return array;
        },

        // Application overrides
        ...options?._fastXML
      };

      const xml = fastParseXML(text, fastXMLOptions);

      // Note - could be done with FastXML tag processing
      return xmlOptions.uncapitalizeKeys ? uncapitalizeKeys(xml) : xml;

    default:
      throw new Error(options?.xml?.parser);
  }
}

export const _typecheckXMLLoader: LoaderWithParser = XMLLoader;
