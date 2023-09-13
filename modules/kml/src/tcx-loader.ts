import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {geojsonToBinary} from '@loaders.gl/gis';
import type {GeoJSONTable, FeatureCollection, ObjectRowTable} from '@loaders.gl/schema';
import {tcx} from '@tmcw/togeojson';
import {DOMParser} from '@xmldom/xmldom';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type TCXLoaderOptions = LoaderOptions & {
  tcx?: {
    shape?: 'object-row-table' | 'geojson-table' | 'geojson' | 'binary' | 'raw';
    /** @deprecated. Use options.tcx.shape */
    type?: 'object-row-table' | 'geojson-table' | 'geojson' | 'binary' | 'raw';
  };
  gis?: {
    /** @deprecated. Use options.tcx.shape */
    format?: 'object-row-table' | 'geojson-table' | 'geojson' | 'binary' | 'raw';
  };
};

const TCX_HEADER = `\
<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase`;

/**
 * Loader for TCX (Training Center XML) - Garmin GPS track format
 */
export const TCXLoader: LoaderWithParser<any, never, TCXLoaderOptions> = {
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
    case 'geojson-table': {
      const table: GeoJSONTable = {
        shape: 'geojson-table',
        type: 'FeatureCollection',
        features: geojson.features
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
