// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {GeoJSONTable, ObjectRowTable, ArrowTable} from '@loaders.gl/schema';
import {
  buildFeatureTableSchema,
  convertFeatureCollectionToArrowTable
} from './lib/feature-collection-to-arrow';
import {convertKMLDocumentToFeatureCollection} from './kml-parser';
import {KMZLoader as KMZLoaderMetadata, type KMZLoaderOptions} from './kmz-loader-types';
import {openKMZArchive} from './kmz-archive';

const {preload: _KMZLoaderPreload, ...KMZLoaderMetadataWithoutPreload} = KMZLoaderMetadata;

/** Parser-bearing loader for KMZ archives containing KML documents. */
export const KMZLoaderWithParser = {
  ...KMZLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer, options?: KMZLoaderOptions) =>
    parseKMZArrayBuffer(arrayBuffer, options)
} as const satisfies LoaderWithParser<
  ObjectRowTable | GeoJSONTable | ArrowTable,
  never,
  KMZLoaderOptions
>;

/** Parses a KMZ archive into the requested public table shape. */
export async function parseKMZArrayBuffer(
  arrayBuffer: ArrayBuffer,
  options?: KMZLoaderOptions
): Promise<ObjectRowTable | GeoJSONTable | ArrowTable> {
  const archive = await openKMZArchive(arrayBuffer);
  try {
    const document = convertKMLDocumentToFeatureCollection(archive.document, {
      includeKMLMetadata: options?.kmz?.includeKMLMetadata
    });
    const shape = options?.kmz?.shape || KMZLoaderWithParser.options.kmz.shape;
    switch (shape) {
      case 'object-row-table':
        return {shape, data: document.features};
      case 'arrow-table':
        return convertFeatureCollectionToArrowTable(document.features);
      case 'geojson-table':
      default:
        return {
          shape: 'geojson-table',
          schema: buildFeatureTableSchema(document.features),
          type: 'FeatureCollection',
          features: document.features
        };
    }
  } finally {
    await archive.close();
  }
}
