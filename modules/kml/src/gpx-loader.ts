// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import type {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import {geojsonToBinary} from '@loaders.gl/gis';
import type {
  GeoJSONTable,
  FeatureCollection,
  ObjectRowTable,
  BinaryFeatureCollection
} from '@loaders.gl/schema';
import {gpx} from '@tmcw/togeojson';
import {DOMParser} from '@xmldom/xmldom';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type GPXLoaderOptions = LoaderOptions & {
  gpx?: {
    shape?: 'object-row-table' | 'geojson-table' | 'binary' | 'raw';
  };
};

const GPX_HEADER = `\
<?xml version="1.0" encoding="UTF-8"?>
<gpx`;

/**
 * Loader for GPX (GPS exchange format)
 */
export const GPXLoader: LoaderWithParser<
  ObjectRowTable | GeoJSONTable | BinaryFeatureCollection,
  never,
  GPXLoaderOptions
> = {
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
    gpx: {shape: 'geojson-table'},
    gis: {}
  }
};

function parseTextSync(
  text: string,
  options?: GPXLoaderOptions
): ObjectRowTable | GeoJSONTable | BinaryFeatureCollection {
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  const geojson: FeatureCollection = gpx(doc);

  const gpxOptions = {...GPXLoader.options.gpx, ...options?.gpx};

  switch (gpxOptions.shape) {
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
    case 'binary':
      return geojsonToBinary(geojson.features);

    default:
      throw new Error(gpxOptions.shape);
  }
}
