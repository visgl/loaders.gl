// SVG parsing has limitations, e.g:
// https://bugs.chromium.org/p/chromium/issues/detail?id=606319

const SVG_DATA_URL_PATTERN = /^data:image\/svg\+xml/;
const SVG_URL_PATTERN = /\.svg((\?|#).*)?$/;

export function isSVG(url) {
  return url && (SVG_DATA_URL_PATTERN.test(url) || SVG_URL_PATTERN.test(url));
}

export function getBlobOrSVGDataUrl(arrayBuffer: ArrayBuffer, url?: string): Blob | string {
  if (isSVG(url)) {
    // Prepare a properly tagged data URL, and load using normal mechanism
    const textDecoder = new TextDecoder();
    let xmlText = textDecoder.decode(arrayBuffer);
    // TODO Escape in browser to support e.g. Chinese characters
    try {
      if (typeof unescape === 'function' && typeof encodeURIComponent === 'function') {
        xmlText = unescape(encodeURIComponent(xmlText));
      }
    } catch (error) {
      throw new Error((error as Error).message);
    }
    // base64 encoding is safer. utf-8 fails in some browsers
    const src = `data:image/svg+xml;base64,${btoa(xmlText)}`;
    return src;
  }
  return getBlob(arrayBuffer, url);
}

export function getBlob(arrayBuffer: ArrayBuffer, url?: string): Blob {
  if (isSVG(url)) {
    // https://bugs.chromium.org/p/chromium/issues/detail?id=606319
    // return new Blob([new Uint8Array(arrayBuffer)], {type: 'image/svg+xml'});
    throw new Error('SVG cannot be parsed directly to imagebitmap');
  }
  // TODO - how to determine mime type? Param? Sniff here?
  return new Blob([new Uint8Array(arrayBuffer)]); // MIME type not needed?
}
