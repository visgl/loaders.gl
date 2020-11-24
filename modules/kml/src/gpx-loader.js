/* global TextDecoder, DOMParser */
import {geojsonToBinary} from '@loaders.gl/gis';
import {gpx} from '@tmcw/togeojson';

/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const GPX_HEADER = `\
<?xml version="1.0" encoding="UTF-8"?>
<gpx`;

function testText(text) {
  return text.startsWith(GPX_HEADER);
}

function parseTextSync(text, options) {
  options = options || {};
  options.gis = options.gis || {};

  const doc = new DOMParser().parseFromString(text, 'text/xml');
  const geojson = gpx(doc);

  switch (options.gis.format) {
    case 'geojson':
      return geojson;
    case 'binary':
      return geojsonToBinary(geojson.features);
    default:
      return doc;
  }
}

/** @type {LoaderObject} */
export default {
  id: 'gpx',
  name: 'GPX',
  version: VERSION,
  extensions: ['gpx'],
  mimeTypes: ['application/gpx+xml'],
  testText,
  parse: async (arrayBuffer, options) =>
    parseTextSync(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync
};
