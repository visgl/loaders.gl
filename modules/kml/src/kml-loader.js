/* global TextDecoder */
import {XMLLoader} from '@loaders.gl/tables';
import {geojsonToBinary} from '@loaders.gl/gis';
import KMLParser from './lib/kml-parser';
import normalizeKML from './lib/kml-normalizer';
import convertKMLToGeoJson from './lib/kml-to-geojson';

/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */

// __VERSION__ is injected by babel-plugin-version-inline
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
  options = options || {};
  options.kml = options.kml || {};
  options.gis = options.gis || {};

  const xml = XMLLoader.parseTextSync(text);
  const kmlLoader = new KMLParser();
  let kml = kmlLoader.parse(xml, options);

  if (options.kml.normalize) {
    kml = normalizeKML(kml);
  }

  switch (options.gis.format) {
    case 'geojson':
      return convertKMLToGeoJson(kml);
    case 'binary':
      const geojson = convertKMLToGeoJson(kml);
      return geojsonToBinary(geojson.features);
    default:
      return kml;
  }
}

/** @type {LoaderObject} */
export default {
  id: 'kml',
  name: 'KML',
  version: VERSION,
  extensions: ['kml'],
  mimeTypes: ['vnd.google-earth.kml+xml'],
  supported: XMLLoader.supported,
  testText,
  parse: async (arrayBuffer, options) =>
    parseTextSync(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync,
  browserOnly: true,
  options: {
    kml: {
      normalize: true
    }
  }
};
