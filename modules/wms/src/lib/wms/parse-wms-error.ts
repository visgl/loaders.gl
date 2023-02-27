// loaders.gl, MIT license

import {XMLLoader} from '@loaders.gl/xml';

/**
 * Extract an error message from WMS error response XML
 * @param text
 * @param options
 * @returns a string with a human readable message
 */
export function parseWMSError(text: string, options): string {
  const parsedXML = XMLLoader.parseTextSync?.(text, options);
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
