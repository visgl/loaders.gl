// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import {geojsonToBinary} from '@loaders.gl/gis';
import type {
  GeoJSONTable,
  FeatureCollection,
  ObjectRowTable,
  BinaryFeatureCollection,
  ArrowTable
} from '@loaders.gl/schema';
import {gpx} from '@tmcw/togeojson';
import {DOMParser} from '@xmldom/xmldom';
import {
  buildFeatureTableSchema,
  convertFeatureCollectionToArrowTable
} from './lib/feature-collection-to-arrow';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type GPXLoaderOptions = LoaderOptions & {
  gpx?: {
    shape?: 'object-row-table' | 'geojson-table' | 'arrow-table' | 'binary' | 'raw';
  };
};

const GPX_HEADER = `\
<?xml version="1.0" encoding="UTF-8"?>
<gpx`;

/**
 * Loader for GPX (GPS exchange format)
 */
export const GPXLoader = {
  dataType: null as unknown as ObjectRowTable | GeoJSONTable | BinaryFeatureCollection | ArrowTable,
  batchType: null as never,

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
} as const satisfies LoaderWithParser<
  ObjectRowTable | GeoJSONTable | BinaryFeatureCollection | ArrowTable,
  never,
  GPXLoaderOptions
>;

/**
 * Parses GPX XML text into a GeoJSON feature collection.
 *
 * @param text - GPX XML document text.
 * @returns Parsed GeoJSON feature collection.
 */
export function parseGPXTextToFeatureCollection(text: string): FeatureCollection {
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  return gpx(doc);
}

/**
 * Parses GPX text into the requested table shape.
 *
 * @param text - GPX XML document text.
 * @param options - Loader options controlling the output shape.
 * @returns A GeoJSON table, object-row table, or binary feature collection.
 */
function parseTextSync(
  text: string,
  options?: GPXLoaderOptions
): ObjectRowTable | GeoJSONTable | BinaryFeatureCollection | ArrowTable {
  const geojson = parseGPXTextToFeatureCollection(text);
  const schema = buildFeatureTableSchema(geojson.features);

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
        schema,
        type: 'FeatureCollection',
        features: geojson.features
      };
      return table;
    }
    case 'arrow-table':
      return convertFeatureCollectionToArrowTable(geojson.features);
    case 'binary':
      return geojsonToBinary(geojson.features);

    default:
      throw new Error(gpxOptions.shape);
  }
}
