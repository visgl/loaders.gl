import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {geojsonToBinary} from '@loaders.gl/gis';
import {kml} from '@tmcw/togeojson';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const KML_HEADER = `\
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">`;

/**
 * Loader for KML (Keyhole Markup Language)
 */
export const KMLLoader: LoaderWithParser = {
  name: 'KML (Keyhole Markup Language)',
  id: 'kml',
  module: 'kml',
  version: VERSION,
  extensions: ['kml'],
  mimeTypes: ['vnd.google-earth.kml+xml'],
  text: true,
  tests: [KML_HEADER],
  parse: async (arrayBuffer, options) =>
    parseTextSync(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync,
  options: {
    kml: {},
    gis: {format: 'geojson'}
  }
};

function parseTextSync(text: string, options: any = {}) {
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

export const _typecheckKMLLoader: LoaderWithParser = KMLLoader;
