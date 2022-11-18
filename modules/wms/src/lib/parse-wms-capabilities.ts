// loaders.gl, MIT license

import {XMLLoader} from '@loaders.gl/xml';

export function parseWMSCapabilities(text, options) {
  const parsedXML = XMLLoader.parseTextSync(text, options);
  if (parsedXML.WMT_MS_Capabilities) {
    return parsedXML.WMT_MS_Capabilities;
  }
  if (parsedXML.WMS_Capabilities) {
    return parsedXML.WMS_Capabilities;
  }
  return parsedXML;
}
