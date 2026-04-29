// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
// import {geojsonToBinary} from '@loaders.gl/gis';
// import {GeoJSONTable} from '@loaders.gl/schema';
import {FeatureCollection, GeoJSONTable, ObjectRowTable, ArrowTable} from '@loaders.gl/schema';
import {kml} from '@tmcw/togeojson';
import {DOMParser} from '@xmldom/xmldom';
import {
  buildFeatureTableSchema,
  convertFeatureCollectionToArrowTable
} from './lib/feature-collection-to-arrow';
import {KMLLoader as KMLLoaderMetadata} from './kml-loader';

const {preload: _KMLLoaderPreload, ...KMLLoaderMetadataWithoutPreload} = KMLLoaderMetadata;

export type KMLLoaderOptions = LoaderOptions & {
  kml?: {
    shape?: 'object-row-table' | 'geojson-table' | 'arrow-table' | 'raw';
  };
};

/**
 * Loader for KML (Keyhole Markup Language)
 */
export const KMLLoaderWithParser = {
  ...KMLLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer, options?: KMLLoaderOptions) =>
    parseTextSync(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync
} as const satisfies LoaderWithParser<
  ObjectRowTable | GeoJSONTable | ArrowTable,
  never,
  KMLLoaderOptions
>;

/**
 * Parses KML XML text into a GeoJSON feature collection.
 *
 * @param text - KML XML document text.
 * @returns Parsed GeoJSON feature collection.
 */
export function parseKMLTextToFeatureCollection(text: string): FeatureCollection {
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  return kml(doc);
}

/**
 * Parses KML text into the requested table shape.
 *
 * @param text - KML XML document text.
 * @param options - Loader options controlling the output shape.
 * @returns A GeoJSON or object-row table.
 */
function parseTextSync(
  text: string,
  options?: KMLLoaderOptions
): ObjectRowTable | GeoJSONTable | ArrowTable {
  const geojson = parseKMLTextToFeatureCollection(text);
  const schema = buildFeatureTableSchema(geojson.features);

  const kmlOptions = {...KMLLoaderWithParser.options.kml, ...options?.kml};

  switch (kmlOptions.shape) {
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
    // case 'raw':
    //   return doc;
    case 'object-row-table':
      const table: ObjectRowTable = {
        shape: 'object-row-table',
        data: geojson.features
      };
      return table;
    default:
      throw new Error(kmlOptions.shape);
  }
}
