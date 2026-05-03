// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {BinaryFeatureCollection, GeoJSONTable, TableBatch} from '@loaders.gl/schema';
import type {JSONLoaderOptions} from './json-loader';
import {geojsonToBinary} from '@loaders.gl/gis';
// import {parseJSONSync} from './lib/parsers/parse-json';
import {parseJSONInBatches} from './lib/parsers/parse-json-in-batches';
import {GeoJSONWorkerLoader as GeoJSONWorkerLoaderMetadata} from './geojson-loader';
import {GeoJSONLoader as GeoJSONLoaderMetadata} from './geojson-loader';

const {preload: _GeoJSONWorkerLoaderPreload, ...GeoJSONWorkerLoaderMetadataWithoutPreload} =
  GeoJSONWorkerLoaderMetadata;
const {preload: _GeoJSONLoaderPreload, ...GeoJSONLoaderMetadataWithoutPreload} =
  GeoJSONLoaderMetadata;

export type GeoJSONLoaderOptions = JSONLoaderOptions & {
  geojson?: {
    shape?: 'geojson-table';
  };
  gis?: {
    format?: 'geojson' | 'binary';
  };
};

/**
 * GeoJSON loader
 */
export const GeoJSONWorkerLoaderWithParser = {
  ...GeoJSONWorkerLoaderMetadataWithoutPreload
} as const satisfies Loader<GeoJSONTable, TableBatch, GeoJSONLoaderOptions>;

export const GeoJSONLoaderWithParser = {
  ...GeoJSONLoaderMetadataWithoutPreload,
  parse,
  parseTextSync,
  parseInBatches
} as const satisfies LoaderWithParser<
  GeoJSONTable | BinaryFeatureCollection,
  TableBatch,
  GeoJSONLoaderOptions
>;

async function parse(
  arrayBuffer: ArrayBuffer,
  options?: GeoJSONLoaderOptions
): Promise<GeoJSONTable | BinaryFeatureCollection> {
  return parseTextSync(new TextDecoder().decode(arrayBuffer), options);
}

function parseTextSync(
  text: string,
  options?: GeoJSONLoaderOptions
): GeoJSONTable | BinaryFeatureCollection {
  // Apps can call the parse method directly, we so apply default options here
  options = {...GeoJSONLoaderWithParser.options, ...options};
  options.geojson = {...GeoJSONLoaderWithParser.options.geojson, ...options.geojson};
  options.gis = options.gis || {};

  let geojson;
  try {
    geojson = JSON.parse(text);
  } catch {
    geojson = {};
  }

  const table: GeoJSONTable = {
    shape: 'geojson-table',
    // TODO - deduce schema from geojson
    // TODO check that parsed data is of type FeatureCollection
    type: 'FeatureCollection',
    features: geojson?.features || []
  };

  switch (options.gis.format) {
    case 'binary':
      return geojsonToBinary(table.features);
    default:
      return table;
  }
}

function parseInBatches(asyncIterator, options): AsyncIterable<TableBatch> {
  // Apps can call the parse method directly, we so apply default options here
  options = {...GeoJSONLoaderWithParser.options, ...options};
  options.json = {...GeoJSONLoaderWithParser.options.json, ...options.json};
  options.geojson = {...GeoJSONLoaderWithParser.options.geojson, ...options.geojson};

  const geojsonIterator = parseJSONInBatches(asyncIterator, options);

  switch (options.gis.format) {
    case 'binary':
      return makeBinaryGeometryIterator(geojsonIterator);
    default:
      return geojsonIterator as AsyncIterable<TableBatch>;
  }
}

async function* makeBinaryGeometryIterator(geojsonIterator) {
  for await (const batch of geojsonIterator) {
    batch.data = geojsonToBinary(batch.data);
    yield batch;
  }
}
