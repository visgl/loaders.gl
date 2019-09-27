/* global TextDecoder, btoa */ // encodeURLComponent,
import {loadToHTMLImage} from './parse-to-html-image';

export default async function parseSVG(arrayBuffer, options) {
  // Prepare a properly tagged data URL, and load using normal mechanism
  const textDecoder = new TextDecoder();
  const xmlText = textDecoder.decode(arrayBuffer);
  // TODO Escape in browser to support e.g. Chinese characters
  // if (typeof unescape === 'function' && typeof encodeURLComponent === 'function') {
  //   xmlText = unescape(encodeURLComponent(xmlText));
  // }
  // base64 encoding is safer. utf-8 fails in some browsers
  const src = `data:image/svg+xml;base64,${btoa(xmlText)}`;
  return await loadToHTMLImage(src, options);
}
