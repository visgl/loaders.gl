import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
// import {geojsonToBinary} from '@loaders.gl/gis';
// import {GeoJSONTable} from '@loaders.gl/schema';
import {FeatureCollection, GeoJSONTable, ObjectRowTable} from '@loaders.gl/schema';
import {kml} from '@tmcw/togeojson';
import {DOMParser} from '@xmldom/xmldom';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type KMLLoaderOptions = LoaderOptions & {
  kml?: {
    shape?: 'object-row-table' | 'geojson-table' | 'binary' | 'raw';
  };
};

const KML_HEADER = `\
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">`;

/**
 * Loader for KML (Keyhole Markup Language)
 */
export const KMLLoader: LoaderWithParser<ObjectRowTable | GeoJSONTable, never, KMLLoaderOptions> = {
  name: 'KML (Keyhole Markup Language)',
  id: 'kml',
  module: 'kml',
  version: VERSION,
  extensions: ['kml'],
  mimeTypes: ['application/vnd.google-earth.kml+xml'],
  text: true,
  tests: [KML_HEADER],
  parse: async (arrayBuffer, options?: KMLLoaderOptions) =>
    parseTextSync(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync,
  options: {
    kml: {shape: 'geojson-table'},
    gis: {}
  }
};

function parseTextSync(text: string, options?: KMLLoaderOptions): ObjectRowTable | GeoJSONTable {
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  const geojson: FeatureCollection = kml(doc);

  // backwards compatibility
  const shape = options?.kml?.shape || KMLLoader.options.kml?.shape;
  switch (shape) {
    case 'geojson-table': {
      const table: GeoJSONTable = {
        shape: 'geojson-table',
        type: 'FeatureCollection',
        features: geojson.features
      };
      return table;
    }
    // case 'geojson':
    //   return geojson;
    // case 'binary':
    //   return geojsonToBinary(geojson.features);
    // case 'raw':
    //   return doc;
    case 'object-row-table':
      const table: ObjectRowTable = {
        shape: 'object-row-table',
        data: geojson.features
      };
      return table;
    default:
      throw new Error(shape);
  }
}
