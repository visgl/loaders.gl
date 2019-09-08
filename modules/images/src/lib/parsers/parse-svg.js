/* global TextDecoder, btoa */
import parseImage from './parse-image';

export async function parseSVG(arrayBuffer, options) {
  // Prepare a properly tagged data URL, and load using normal mechanism
  const textDecoder = new TextDecoder();
  const xmlText = textDecoder.decode(arrayBuffer);
  // base64 encoding is safer. utf-8 fails in some browsers
  const src = `data:image/svg+xml;base64,${btoa(xmlText)}`;
  return await parseImage(src);
}
