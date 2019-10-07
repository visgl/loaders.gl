/* global __VERSION__ */ // __VERSION__ is injected by babel-plugin-version-inline
/* global TextDecoder */
import {XMLLoader} from '@loaders.gl/experimental';
import KMLParser from './lib/kml-parser';
import normalizeKML from './lib/kml-normalizer';

const KML_HEADER = `\
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
`;

function testText(text) {
  return text.startsWith(KML_HEADER);
}

function parseTextSync(text, options) {
  const xml = XMLLoader.parseTextSync(text);
  const kmlLoader = new KMLParser();
  const kml = kmlLoader.parse(xml, options);
  return options.normalize ? normalizeKML(kml) : kml;
}

export default {
  id: 'kml',
  name: 'KML',
  version: __VERSION__,
  extensions: ['kml'],
  mimeType: 'vnd.google-earth.kml+xml',
  supported: XMLLoader.supported,
  testText,
  parse: async (arrayBuffer, options) =>
    parseTextSync(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync,
  browserOnly: true,
  options: {
    normalize: true
  }
};
