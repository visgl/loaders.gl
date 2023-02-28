// loaders.gl, MIT license

import type {XMLLoaderOptions} from '@loaders.gl/xml';
import {XMLLoader} from '@loaders.gl/xml';
import {parseExceptionReport} from './parse-exception-report';

/** Describes the values of resource */
export type CSWDomain = {
  domainValues: {
    type: string;
    propertyName: string;
    values: {
      [key: string]: unknown;
    }[];
  }[];
};

/**
 * Parses a typed data structure from raw XML for `GetDomain` response
 * @note Error handlings is fairly weak
 */
export function parseCSWDomain(text: string, options?: XMLLoaderOptions): CSWDomain {
  const parsedXML = XMLLoader.parseTextSync(text, {
    ...options,
    xml: {
      ...options?.xml,
      removeNSPrefix: true,
      uncapitalizeKeys: true,
      arrayPaths: [
        'GetDomainResponse.DomainValues',
        'GetDomainResponse.DomainValues.ListOfValues.value'
      ]
    }
  });

  parseExceptionReport(parsedXML);

  const xmlDomain: any = parsedXML.getDomainResponse;
  for (const domainValue of xmlDomain.domainValues) {
    // Drop the nested <listOfValues><value><value><listOfValues>  => values[]
    domainValue.values = domainValue.listOfValues?.value;
    delete domainValue.listOfValues;
  }
  return xmlDomain as CSWDomain;
}
