import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {geojsonToBinary} from '@loaders.gl/gis';
import {tcx} from '@tmcw/togeojson';
import type {GeoJSONRowTable, FeatureCollection, ObjectRowTable} from '@loaders.gl/schema';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

type TCXSupportedShapes = 'object-row-table' | 'geojson-row-table' | 'geojson' | 'binary' | 'raw';

export type TCXLoaderOptions = LoaderOptions & {
  tcx?: {
    shape?: TCXSupportedShapes;
    type?: TCXSupportedShapes;
  };
  gis?: {
    format?: TCXSupportedShapes;
  };
};

const TCX_HEADER = `\
<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase`;

/**
 * Loader for TCX (Training Center XML) - Garmin GPS track format
 */
export const TCXLoader = {
  name: 'TCX (Training Center XML)',
  id: 'tcx',
  module: 'kml',
  version: VERSION,
  extensions: ['tcx'],
  mimeTypes: ['application/vnd.garmin.tcx+xml'],
  text: true,
  tests: [TCX_HEADER],
  parse: async (arrayBuffer, options?: TCXLoaderOptions) =>
    parseTextSync(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync,
  options: {
    tcx: {},
    gis: {}
  }
};

function parseTextSync(text: string, options?: TCXLoaderOptions) {
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  const geojson: FeatureCollection = tcx(doc);

  // backwards compatibility
  const shape = options?.gis?.format || options?.tcx?.type || options?.tcx?.shape;

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

export const _typecheckTCXLoader: LoaderWithParser = TCXLoader;
