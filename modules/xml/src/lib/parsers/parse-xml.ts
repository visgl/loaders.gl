// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {SAXParserOptions} from '../../sax-ts/sax';
import {StreamingXMLParser} from './streaming-xml-parser';
import {uncapitalizeKeys} from '../xml-utils/uncapitalize';
import {XMLParser as FastXMLParser} from 'fast-xml-parser';
import type {X2jOptions} from 'fast-xml-parser';

export type ParseXMLOptions = {
  /** XML is typically PascalCase, JavaScript prefects camelCase */
  uncapitalizeKeys?: boolean;
  removeNSPrefix?: boolean;
  textNodeName?: string;
  arrayPaths?: string[];

  // NOTE: Only fast-xml-parser is implemented
  _parser?: 'fast-xml-parser' | 'sax';
  /** @deprecated Experimental, passes options to fast-xml-parser, IF it is being used */
  _fastXML?: _FastParseXMLOptions;
  /** @deprecated Experimental, passes options to the SAX XML parser, IF it is being used. */
  _sax?: SAXParserOptions;
};

/** Type for passing through fast-xml-parser options */
export type _FastParseXMLOptions = Partial<X2jOptions>;

export function parseXMLSync(text: string, options?: ParseXMLOptions): any {
  if (options?._parser && options._parser !== 'fast-xml-parser') {
    throw new Error(options?._parser);
  }

  const fastXMLOptions: _FastParseXMLOptions = {
    // Default FastXML options
    // https://github.com/NaturalIntelligence/fast-xml-parser/blob/master/docs/v4/2.XMLparseOptions.md#allowbooleanattributes
    allowBooleanAttributes: true,
    // https://github.com/NaturalIntelligence/fast-xml-parser/blob/master/docs/v4/2.XMLparseOptions.md#ignoredeclaration
    ignoreDeclaration: true,

    // https://github.com/NaturalIntelligence/fast-xml-parser/blob/master/docs/v4/2.XMLparseOptions.md#removensprefix
    removeNSPrefix: options?.removeNSPrefix,

    // https://github.com/NaturalIntelligence/fast-xml-parser/blob/master/docs/v4/2.XMLparseOptions.md#textnodename
    textNodeName: options?.textNodeName,

    // Let's application specify keys that are always arrays
    isArray: (name: string, jpath: string, isLeafNode: boolean, isAttribute: boolean) => {
      const array = Boolean(options?.arrayPaths?.some((path) => jpath === path));
      return array;
    },

    // Application overrides
    ...options?._fastXML
  };

  const xml = fastParseXML(text, fastXMLOptions);

  // Note - could be done with FastXML tag processing
  return options?.uncapitalizeKeys ? uncapitalizeKeys(xml) : xml;
}

export function fastParseXML(text: string, options: _FastParseXMLOptions): any {
  const parser = new FastXMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    ...options
  });

  const parsedXML = parser.parse(text);

  return parsedXML;
}

/**
 * @todo Build a streaming XML parser based on sax-js
 * @param text
 * @param options
 * @returns
 */
export function parseXMLInBatches(text: string, options = {}): any {
  const parser = new StreamingXMLParser({
    ...options,
    strict: true
  });

  parser.write(text);
  parser.close();

  return parser.result;
}
