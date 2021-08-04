import type {LoaderOptions} from '@loaders.gl/loader-utils';
import {geojsonToBinary} from '@loaders.gl/gis';
import {gpx} from '@tmcw/togeojson';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type GPXLoaderOptions = LoaderOptions & {
  gpx?: {};
};

const GPX_HEADER = `\
<?xml version="1.0" encoding="UTF-8"?>
<gpx`;

/**
 * Loader for GPX (GPS exchange format)
 */
export const GPXLoader = {
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

function parseTextSync(text: string, options: any) {
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  const geojson = gpx(doc);

  switch (options?.gpx?.type) {
    case 'object-row-table':
      return geojson.features;
    default:
  }

  switch (options?.gis?.format) {
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

export const _typecheckGPXLoader = GPXLoader;
