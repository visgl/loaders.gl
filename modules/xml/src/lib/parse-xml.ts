// loaders.gl, MIT license

import {XMLParser} from '../lib/parser/xml-parser';
import {XMLParser as FastXMLParser} from 'fast-xml-parser';

export function parseXML(text: string, options): any {
  const parser = new FastXMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    // parseAttributeValue: true,
    ...options?.xml
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
export function parseXMLInBatches(text: string, options): any {
  const parser = new XMLParser({
    ...options,
    strict: true
  });

  parser.write(text);
  parser.close();

  return parser.result;
}
