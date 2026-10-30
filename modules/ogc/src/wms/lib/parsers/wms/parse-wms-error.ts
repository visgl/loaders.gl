// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parseXMLTextSync} from '../xml/parse-xml-text';

/**
 * Extract an error message from WMS error response XML
 * @param text
 * @param options
 * @returns a string with a human readable message
 */
export function parseWMSError(text: string, options): string {
  const trimmed = text.trim();
  const xml = trimmed.startsWith('"<') && trimmed.endsWith('>"') ? trimmed.slice(1, -1) : text;
  const parsedXML = parseXMLTextSync(xml, options);
  const serviceExceptionXML =
    parsedXML?.ServiceExceptionReport?.ServiceException ||
    parsedXML?.['ogc:ServiceExceptionReport']?.['ogc:ServiceException'];
  // Sigh, can be either a string or an object
  const message =
    typeof serviceExceptionXML === 'string'
      ? serviceExceptionXML
      : serviceExceptionXML.value || serviceExceptionXML.code || 'Unknown error';
  return message;
}
