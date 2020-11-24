/* global TextDecoder, DOMParser */
import {geojsonToBinary} from '@loaders.gl/gis';
import {tcx} from '@tmcw/togeojson';

/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const TCX_HEADER = `\
<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase`;

function testText(text) {
  return text.startsWith(TCX_HEADER);
}

function parseTextSync(text, options) {
  options = options || {};
  options.gis = options.gis || {};

  const doc = new DOMParser().parseFromString(text, 'text/xml');
  const geojson = tcx(doc);

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
  id: 'tcx',
  name: 'TCX',
  version: VERSION,
  extensions: ['tcx'],
  mimeTypes: ['application/vnd.garmin.tcx+xml'],
  testText,
  parse: async (arrayBuffer, options) =>
    parseTextSync(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync
};
