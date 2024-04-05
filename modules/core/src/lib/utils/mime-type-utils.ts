// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// TODO - build/integrate proper MIME type parsing
// https://mimesniff.spec.whatwg.org/

const DATA_URL_PATTERN = /^data:([-\w.]+\/[-\w.+]+)(;|,)/;
const MIME_TYPE_PATTERN = /^([-\w.]+\/[-\w.+]+)/;

/**
 * Compare two MIME types, case insensitively etc.
 * @param mimeType1
 * @param mimeType2
 * @returns true if the MIME types are equivalent
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types#structure_of_a_mime_type
 */
export function compareMIMETypes(mimeType1: string, mimeType2: string): boolean {
  if (mimeType1.toLowerCase() === mimeType2.toLowerCase()) {
    return true;
  }
  return false;
}

/**
 * Remove extra data like `charset` from MIME types
 * @param mimeString
 * @returns A clean MIME type, or an empty string
 *
 * @todo - handle more advanced MIMETYpes, multiple types
 * @todo - extract charset etc
 */
export function parseMIMEType(mimeString: string): string {
  // If resource is a data url, extract any embedded mime type
  const matches = MIME_TYPE_PATTERN.exec(mimeString);
  if (matches) {
    return matches[1];
  }
  return mimeString;
}

/**
 * Extract MIME type from data URL
 *
 * @param mimeString
 * @returns A clean MIME type, or an empty string
 *
 * @todo - handle more advanced MIMETYpes, multiple types
 * @todo - extract charset etc
 */
export function parseMIMETypeFromURL(url: string): string {
  // If resource is a data URL, extract any embedded mime type
  const matches = DATA_URL_PATTERN.exec(url);
  if (matches) {
    return matches[1];
  }
  return '';
}
