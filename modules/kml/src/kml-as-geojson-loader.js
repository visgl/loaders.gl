import {XMLLoader} from '@loaders.gl/experimental';
import KMLParser from './kml-parser';
import normalizeKML from './kml-normalizer';
import convertKMLToGeoJson from './kml-to-geojson';

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
  extension: 'kml',
  category: 'geojson',
  supported: XMLLoader.supported,
  testText,
  parseTextSync,
  browserOnly: true,
  worker: false,
  DEFAULT_OPTIONS
};
