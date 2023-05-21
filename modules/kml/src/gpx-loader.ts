import type {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import {geojsonToBinary} from '@loaders.gl/gis';
import type {GeoJSONRowTable, FeatureCollection, ObjectRowTable} from '@loaders.gl/schema';
import {gpx} from '@tmcw/togeojson';
import {DOMParser} from '@xmldom/xmldom';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type GPXLoaderOptions = LoaderOptions & {
  gpx?: {
    shape?: 'object-row-table' | 'geojson-row-table' | 'geojson' | 'binary' | 'raw';
    /** @deprecated. Use options.gpx.shape */
    type?: 'object-row-table' | 'geojson-row-table' | 'geojson' | 'binary' | 'raw';
  };
  gis?: {
    /** @deprecated. Use options.gpx.shape */
    format?: 'object-row-table' | 'geojson-row-table' | 'geojson' | 'binary' | 'raw';
  };
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
  parse: async (arrayBuffer, options?: GPXLoaderOptions) =>
    parseTextSync(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync,
  options: {
    gpx: {},
    gis: {}
  }
};

function parseTextSync(text: string, options?: GPXLoaderOptions) {
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  const geojson: FeatureCollection = gpx(doc);

  const shape = options?.gis?.format || options?.gpx?.type || options?.gpx?.shape;

  switch (shape) {
    case 'object-row-table': {
      const table: ObjectRowTable = {
        shape: 'object-row-table',
        data: geojson.features
      };
      return table;
    }
    case 'geojson-row-table': {
      const table: GeoJSONRowTable = {
        shape: 'geojson-row-table',
        data: geojson.features
      };
      return table;
    }
    case 'geojson':
      return geojson;
    case 'binary':
      return geojsonToBinary(geojson.features);
    case 'raw':
      return doc;
    default:
      // Default to geojson for backwards compatibility
      return geojson;
  }
}

export const _typecheckGPXLoader: LoaderWithParser = GPXLoader;
