// loaders.gl, MIT license

import {StreamingXMLParser} from './streaming-xml-parser';
import {XMLParser as FastXMLParser} from 'fast-xml-parser';
import type {X2jOptions} from 'fast-xml-parser';

/** Type for passing through fast-xml-parser options */
export type FastXMLParserOptions = Partial<X2jOptions>;

export function fastParseXML(text: string, options: FastXMLParserOptions): any {
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
