/* global Blob, TextDecoder, btoa */ // encodeURLComponent,

const SVG_DATA_URL_PATTERN = /^data:image\/svg\+xml/;
const SVG_URL_PATTERN = /\.svg((\?|#).*)?$/;

export function getBlob(arrayBuffer, url) {
  if (isSVG(url)) {
    // https://bugs.chromium.org/p/chromium/issues/detail?id=606319
    // eslint-disable-next-line
    console.warn('SVG cannot be parsed to imagebitmap');
    return new Blob([new Uint8Array(arrayBuffer)], {type: 'image/svg+xml'});
  }
  // TODO - how to determine mime type? Param? Sniff here?
  return new Blob([new Uint8Array(arrayBuffer)]); // MIME type not needed?
}

export function getBlobOrDataUrl(arrayBuffer, url) {
  if (isSVG(url)) {
    // Prepare a properly tagged data URL, and load using normal mechanism
    const textDecoder = new TextDecoder();
    const xmlText = textDecoder.decode(arrayBuffer);
    // TODO Escape in browser to support e.g. Chinese characters
    // if (typeof unescape === 'function' && typeof encodeURLComponent === 'function') {
    //   xmlText = unescape(encodeURLComponent(xmlText));
    // }
    // base64 encoding is safer. utf-8 fails in some browsers
    const src = `data:image/svg+xml;base64,${btoa(xmlText)}`;
    return src;
  }
  return getBlob(arrayBuffer, url);
}

function isSVG(url) {
  return url && (SVG_DATA_URL_PATTERN.test(url) || SVG_URL_PATTERN.test(url));
}
