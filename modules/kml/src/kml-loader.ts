import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {geojsonToBinary} from '@loaders.gl/gis';
import {GeoJSONRowTable, FeatureCollection, ObjectRowTable} from '@loaders.gl/schema';
import {kml} from '@tmcw/togeojson';
import {DOMParser} from '@xmldom/xmldom';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type KMLLoaderOptions = LoaderOptions & {
  kml?: {
    shape?: 'object-row-table' | 'geojson-row-table' | 'geojson' | 'binary' | 'raw';
    /** @deprecated. Use options.kml.shape */
    type?: 'object-row-table' | 'geojson-row-table' | 'geojson' | 'binary' | 'raw';
  };
  gis?: {
    /** @deprecated. Use options.kml.shape */
    format?: 'object-row-table' | 'geojson-row-table' | 'geojson' | 'binary' | 'raw';
  };
};

const KML_HEADER = `\
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">`;

/**
 * Loader for KML (Keyhole Markup Language)
 */
export const KMLLoader: LoaderWithParser<ObjectRowTable, never, KMLLoaderOptions> = {
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
    kml: {},
    gis: {}
  }
};

function parseTextSync(text: string, options?: KMLLoaderOptions): ObjectRowTable {
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  const geojson: FeatureCollection = kml(doc);

  // backwards compatibility
  const shape = options?.gis?.format || options?.kml?.type || options?.kml?.shape;
  switch (shape) {
    // case 'geojson-row-table': {
    //   const table: GeoJSONRowTable = {
    //     shape: 'geojson-row-table',
    //     data: geojson.features
    //   };
    //   return table;
    // }
    // case 'geojson':
    //   return geojson;
    // case 'binary':
    //   return geojsonToBinary(geojson.features);
    // case 'raw':
    //   return doc;
    case 'object-row-table':
    default:
      const table: ObjectRowTable = {
        shape: 'object-row-table',
        data: geojson.features
      };
      return table;
  }
}
