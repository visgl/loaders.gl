// TODO - build/integrate proper MIME type parsing
// https://mimesniff.spec.whatwg.org/

const DATA_URL_PATTERN = /^data:([-\w.]+\/[-\w.+]+)(;|,)/;
const MIME_TYPE_PATTERN = /^([-\w.]+\/[-\w.+]+)/;

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
