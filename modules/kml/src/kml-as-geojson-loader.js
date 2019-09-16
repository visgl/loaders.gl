/* global TextDecoder */
import {XMLLoader} from '@loaders.gl/experimental';
import KMLParser from './lib/kml-parser';
import normalizeKML from './lib/kml-normalizer';
import convertKMLToGeoJson from './lib/kml-to-geojson';

const KML_HEADER = `\
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
`;

const DEFAULT_OPTIONS = {
  normalize: true
};

function testText(text) {
  return text.startsWith(KML_HEADER);
}

function parseTextSync(text, options = DEFAULT_OPTIONS) {
  const xml = XMLLoader.parseTextSync(text);
  const kmlLoader = new KMLParser();
  let kml = kmlLoader.parse(xml, options);
  kml = normalizeKML(kml);
  return convertKMLToGeoJson(kml, options);
}

export default {
  name: 'KML',
  extensions: ['kml'],
  mimeType: 'vnd.google-earth.kml+xml',
  category: 'geojson',
  supported: XMLLoader.supported,
  testText,
  parse: arrayBuffer => parseTextSync(new TextDecoder().decode(arrayBuffer)),
  parseTextSync,
  browserOnly: true,
  worker: false,
  DEFAULT_OPTIONS
};
