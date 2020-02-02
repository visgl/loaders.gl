// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */

/* global TextDecoder */
import {XMLLoader} from '@loaders.gl/tables';
import KMLParser from './lib/kml-parser';
import normalizeKML from './lib/kml-normalizer';
import convertKMLToGeoJson from './lib/kml-to-geojson';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

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
  let kml = kmlLoader.parse(xml, options);
  kml = normalizeKML(kml);
  return convertKMLToGeoJson(kml, options);
}

export default {
  id: 'kml',
  name: 'KML',
  version: VERSION,
  extensions: ['kml'],
  mimeType: 'vnd.google-earth.kml+xml',
  category: 'geojson',
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
