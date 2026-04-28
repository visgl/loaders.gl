// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {BinaryFeatureCollection, GeoJSONTable, TableBatch} from '@loaders.gl/schema';
import type {JSONLoaderOptions} from './json-loader';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type GeoJSONLoaderOptions = JSONLoaderOptions & {
  geojson?: {
    shape?: 'geojson-table';
  };
  gis?: {
    format?: 'geojson' | 'binary';
  };
};

/** Preloads the parser-bearing GeoJSON loader implementation. */
async function preload() {
  const {GeoJSONLoaderWithParser} = await import('./geojson-loader-with-parser');
  return GeoJSONLoaderWithParser;
}

/** Metadata-only GeoJSON worker loader. */
export const GeoJSONWorkerLoader = {
  dataType: null as unknown as GeoJSONTable,
  batchType: null as unknown as TableBatch,

  name: 'GeoJSON',
  id: 'geojson',
  module: 'geojson',
  version: VERSION,
  worker: true,
  workerFile: 'json-classic.js',
  workerModuleFile: 'json-module.js',
  workerNodeFile: 'json-classic-node.cjs',
  workerPackage: 'json',
  extensions: ['geojson'],
  mimeTypes: ['application/geo+json'],
  category: 'geometry',
  text: true,
  options: {
    geojson: {
      shape: 'geojson-table'
    },
    json: {
      shape: 'object-row-table',
      jsonpaths: ['$', '$.features']
    },
    gis: {
      format: 'geojson'
    }
  },
  preload
} as const satisfies Loader<GeoJSONTable, TableBatch, GeoJSONLoaderOptions>;

/** Metadata-only GeoJSON loader. */
export const GeoJSONLoader = {
  ...GeoJSONWorkerLoader
} as const satisfies Loader<
  GeoJSONTable | BinaryFeatureCollection,
  TableBatch,
  GeoJSONLoaderOptions
>;
