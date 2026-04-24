// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {geojsonToBinary} from '@loaders.gl/gis';
import type {
  GeoJSONTable,
  FeatureCollection,
  ObjectRowTable,
  BinaryFeatureCollection,
  ArrowTable
} from '@loaders.gl/schema';
import {tcx} from '@tmcw/togeojson';
import {DOMParser} from '@xmldom/xmldom';
import {
  buildFeatureTableSchema,
  convertFeatureCollectionToArrowTable
} from './lib/feature-collection-to-arrow';
import {TCXLoader as TCXLoaderMetadata} from './tcx-loader';

const {preload: _TCXLoaderPreload, ...TCXLoaderMetadataWithoutPreload} = TCXLoaderMetadata;

export type TCXLoaderOptions = LoaderOptions & {
  tcx?: {
    shape?: 'object-row-table' | 'geojson-table' | 'arrow-table' | 'binary' | 'raw';
  };
};

/**
 * Loader for TCX (Training Center XML) - Garmin GPS track format
 */
export const TCXLoaderWithParser = {
  ...TCXLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer, options?: TCXLoaderOptions) =>
    parseTextSync(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync
} as const satisfies LoaderWithParser<
  ObjectRowTable | GeoJSONTable | BinaryFeatureCollection | ArrowTable,
  never,
  TCXLoaderOptions
>;

/**
 * Parses TCX XML text into a GeoJSON feature collection.
 *
 * @param text - TCX XML document text.
 * @returns Parsed GeoJSON feature collection.
 */
export function parseTCXTextToFeatureCollection(text: string): FeatureCollection {
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  return tcx(doc);
}

/**
 * Parses TCX text into the requested table shape.
 *
 * @param text - TCX XML document text.
 * @param options - Loader options controlling the output shape.
 * @returns A GeoJSON table, object-row table, or binary feature collection.
 */
function parseTextSync(
  text: string,
  options?: TCXLoaderOptions
): ObjectRowTable | GeoJSONTable | BinaryFeatureCollection | ArrowTable {
  const geojson = parseTCXTextToFeatureCollection(text);
  const schema = buildFeatureTableSchema(geojson.features);

  const tcxOptions = {...TCXLoaderWithParser.options.tcx, ...options?.tcx};

  switch (tcxOptions.shape) {
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
        schema,
        features: geojson.features
      };
      return table;
    }
    case 'arrow-table':
      return convertFeatureCollectionToArrowTable(geojson.features);
    case 'binary':
      return geojsonToBinary(geojson.features);

    default:
      throw new Error(tcxOptions.shape);
  }
}
