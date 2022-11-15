// loaders.gl, MIT license

import {XMLLoader} from '@loaders.gl/xml';

export function parseWMSCapabilities(text, options) {
  return XMLLoader.parseTextSync(text, options);
}
