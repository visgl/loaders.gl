import {geojsonToBinary} from '@loaders.gl/gis';
import {gpx} from '@tmcw/togeojson';

import type {LoaderWithParser} from '@loaders.gl/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const GPX_HEADER = `\
<?xml version="1.0" encoding="UTF-8"?>
<gpx`;

/**
 * Loader for GPX (GPS exchange format)
 */
export const GPXLoader: LoaderWithParser = {
  name: 'GPX (GPS exchange format)',
  id: 'gpx',
  module: 'kml',
  version: VERSION,
  extensions: ['gpx'],
  mimeTypes: ['application/gpx+xml'],
  text: true,
  tests: [GPX_HEADER],
  parse: async (arrayBuffer, options) =>
    parseTextSync(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync,
  options: {
    gpx: {},
    gis: {format: 'geojson'}
  }
};

function parseTextSync(text: string, options: any = {}) {
  options = options || {};
  options.gis = options.gis || {};

  const doc = new DOMParser().parseFromString(text, 'text/xml');
  const geojson = gpx(doc);

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
