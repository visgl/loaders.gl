// TODO - build/integrate proper MIME type parsing
// https://mimesniff.spec.whatwg.org/

const DATA_URL_PATTERN = /^data:([-\w.]+\/[-\w.+]+)(;|,)/;
const MIME_TYPE_PATTERN = /^([-\w.]+\/[-\w.+]+)/;

export function parseMIMEType(mimeString) {
  if (typeof mimeString !== 'string') {
    return '';
  }

  // If resource is a data url, extract any embedded mime type
  const matches = mimeString.match(MIME_TYPE_PATTERN);
  if (matches) {
    return matches[1];
  }

  return mimeString;
}

export function parseMIMETypeFromURL(dataUrl) {
  if (typeof dataUrl !== 'string') {
    return '';
  }

  // If resource is a data URL, extract any embedded mime type
  const matches = dataUrl.match(DATA_URL_PATTERN);
  if (matches) {
    return matches[1];
  }

  return '';
}
