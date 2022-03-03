import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {geojsonToBinary} from '@loaders.gl/gis';
import {kml} from '@tmcw/togeojson';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type KMLLoaderOptions = LoaderOptions & {
  kml?: {
    shape: 'geojson-table' | 'columnar-table' | 'geojson' | 'binary' | 'raw';
  };
};

const KML_HEADER = `\
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">`;

/**
 * Loader for KML (Keyhole Markup Language)
 */
export const KMLLoader = {
  name: 'KML (Keyhole Markup Language)',
  id: 'kml',
  module: 'kml',
  version: VERSION,
  extensions: ['kml'],
  mimeTypes: ['application/vnd.google-earth.kml+xml'],
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

function parseTextSync(text: string, options: any) {
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  const geojson = kml(doc);

  // backwards compatibility
  const shape = options?.gis?.format || options?.kml?.type || options?.kml?.shape;
  switch (shape) {
    case 'geojson':
      return geojson;
    case 'binary':
      return geojsonToBinary(geojson.features);
    case 'raw':
      return doc;
    case 'object-row-table':
      return geojson.features;
    default:
      throw new Error(shape);
  }
}

export const _typecheckKMLLoader: LoaderWithParser = KMLLoader;
