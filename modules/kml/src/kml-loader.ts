import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {geojsonToBinary} from '@loaders.gl/gis';
import {kml} from '@tmcw/togeojson';
import {GeoJSONRowTable, FeatureCollection, ObjectRowTable} from '@loaders.gl/schema';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

type KMLSupportedShapes = 'object-row-table' | 'geojson-row-table' | 'geojson' | 'binary' | 'raw';
// 'geojson-table' | 'columnar-table' | 'geojson' | 'binary' | 'raw';

export type KMLLoaderOptions = LoaderOptions & {
  kml?: {
    shape?: KMLSupportedShapes;
    type?: KMLSupportedShapes;
  };
  gis?: {
    format?: KMLSupportedShapes;
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
  parse: async (arrayBuffer, options?: KMLLoaderOptions) =>
    parseTextSync(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync,
  options: {
    kml: {},
    gis: {}
  }
};

function parseTextSync(text: string, options?: KMLLoaderOptions) {
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  const geojson: FeatureCollection = kml(doc);

  // backwards compatibility
  const shape = options?.gis?.format || options?.kml?.type || options?.kml?.shape;
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

export const _typecheckKMLLoader: LoaderWithParser = KMLLoader;
