/* global TextDecoder, DOMParser */
import {geojsonToBinary} from '@loaders.gl/gis';
import {kml} from '@tmcw/togeojson';

/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const KML_HEADER = `\
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">`;

function parseTextSync(text, options) {
  options = options || {};
  options.kml = options.kml || {};
  options.gis = options.gis || {};

  const doc = new DOMParser().parseFromString(text, 'text/xml');
  const geojson = kml(doc);

  switch (options.gis.format) {
    case 'geojson':
      return geojson;
    case 'binary':
      return geojsonToBinary(geojson.features);
    case 'raw':
      return doc;
    default:
      throw new Error();
  }
}

/** @type {LoaderObject} */
export default {
  id: 'kml',
  name: 'KML',
  version: VERSION,
  extensions: ['kml'],
  mimeTypes: ['vnd.google-earth.kml+xml'],
  text: true,
  tests: [KML_HEADER],
  parse: async (arrayBuffer, options) =>
    parseTextSync(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync
};
