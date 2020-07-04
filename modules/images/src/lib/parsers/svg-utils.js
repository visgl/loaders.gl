/* global TextDecoder, Blob, btoa */
// SVG parsing has limitations, e.g:
// https://bugs.chromium.org/p/chromium/issues/detail?id=606319

const SVG_DATA_URL_PATTERN = /^data:image\/svg\+xml/;
const SVG_URL_PATTERN = /\.svg((\?|#).*)?$/;

export function isSVG(url) {
  return url && (SVG_DATA_URL_PATTERN.test(url) || SVG_URL_PATTERN.test(url));
}

export function getBlobOrSVGDataUrl(arrayBuffer, url) {
  if (isSVG(url)) {
    // Prepare a properly tagged data URL, and load using normal mechanism
    const textDecoder = new TextDecoder();
    const xmlText = textDecoder.decode(arrayBuffer);
    // base64 encoding is safer. utf-8 fails in some browsers
    return `data:image/svg+xml;base64,${btoa(xmlText)}`;

    // TODO Escape in browser to support Chinese characters etc?
    // if (typeof unescape === 'function' && typeof encodeURLComponent === 'function') {
    //   xmlText = unescape(encodeURLComponent(xmlText));
    // }
  }

  // TODO - MIME type not needed?
  return new Blob([arrayBuffer]);
}
