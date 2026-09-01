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
  ArrowTable,
  GeoArrowEncodingPreference
} from '@loaders.gl/schema';
import {
  buildFeatureTableSchema,
  convertFeatureCollectionToArrowTable
} from './lib/feature-collection-to-arrow';
import {GPXLoader as GPXLoaderMetadata} from './gpx-loader';
import {parseGPXTextToFeatureCollection as parseGPXDocumentText} from './sports-track-parser';

const {preload: _GPXLoaderPreload, ...GPXLoaderMetadataWithoutPreload} = GPXLoaderMetadata;

export type GPXLoaderOptions = LoaderOptions & {
  /** Preferred encoding for Arrow geometry output. */
  geoarrow?: {encodingPreference?: GeoArrowEncodingPreference};
  gpx?: {
    shape?: 'object-row-table' | 'geojson-table' | 'arrow-table' | 'binary-geometry' | 'raw';
    geoarrow?: {encodingPreference?: GeoArrowEncodingPreference};
  };
};

/**
 * Loader for GPX (GPS exchange format)
 */
export const GPXLoaderWithParser = {
  ...GPXLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer, options?: GPXLoaderOptions) =>
    parseTextSync(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync
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
  return parseGPXDocumentText(text);
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

  const gpxOptions = {...GPXLoaderWithParser.options.gpx, ...options?.gpx};

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
      return convertFeatureCollectionToArrowTable(
        geojson.features,
        options?.geoarrow || gpxOptions.geoarrow
      );
    case 'binary-geometry':
      return geojsonToBinary(geojson.features);

    default:
      throw new Error(gpxOptions.shape);
  }
}
