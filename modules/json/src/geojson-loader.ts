// loaders.gl, MIT license

import type {Loader, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {GeoJSON, GeoJSONRowTable, TableBatch} from '@loaders.gl/schema';
import type {JSONLoaderOptions} from './json-loader';
import {geojsonToBinary} from '@loaders.gl/gis';
import {parseJSONSync} from './lib/parsers/parse-json';
import {parseJSONInBatches} from './lib/parsers/parse-json-in-batches';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type GeoJSONLoaderOptions = JSONLoaderOptions & {
  geojson?: {
    shape?: 'object-row-table';
  };
  gis?: {
    format?: 'geojson' | 'binary';
  };
};

/**
 * GeoJSON loader
 */
export const GeoJSONWorkerLoader: Loader<GeoJSON, TableBatch, GeoJSONLoaderOptions> = {
  name: 'GeoJSON',
  id: 'geojson',
  module: 'geojson',
  version: VERSION,
  worker: true,
  extensions: ['geojson'],
  mimeTypes: ['application/geo+json'],
  category: 'geometry',
  text: true,
  options: {
    geojson: {
      shape: 'object-row-table'
    },
    json: {
      jsonpaths: ['$', '$.features']
    },
    gis: {
      format: 'geojson'
    }
  }
};

export const GeoJSONLoader: LoaderWithParser<GeoJSON, TableBatch, GeoJSONLoaderOptions> = {
  ...GeoJSONWorkerLoader,
  // @ts-expect-error
  parse,
  // @ts-expect-error
  parseTextSync,
  parseInBatches
};

async function parse(arrayBuffer: ArrayBuffer, options?: GeoJSONLoaderOptions) {
  return parseTextSync(new TextDecoder().decode(arrayBuffer), options);
}

function parseTextSync(text: string, options?: GeoJSONLoaderOptions) {
  // Apps can call the parse method directly, we so apply default options here
  options = {...GeoJSONLoader.options, ...options};
  options.geojson = {...GeoJSONLoader.options.geojson, ...options.geojson};
  options.gis = options.gis || {};
  const table = parseJSONSync(text, options) as GeoJSONRowTable;
  table.shape = 'geojson-row-table';
  switch (options.gis.format) {
    case 'binary':
      return geojsonToBinary(table.data);
    default:
      return table;
  }
}

function parseInBatches(asyncIterator, options): AsyncIterable<TableBatch> {
  // Apps can call the parse method directly, we so apply default options here
  options = {...GeoJSONLoader.options, ...options};
  options.json = {...GeoJSONLoader.options.geojson, ...options.geojson};

  const geojsonIterator = parseJSONInBatches(asyncIterator, options);

  switch (options.gis.format) {
    case 'binary':
      return makeBinaryGeometryIterator(geojsonIterator);
    default:
      return geojsonIterator;
  }
}

async function* makeBinaryGeometryIterator(geojsonIterator) {
  for await (const batch of geojsonIterator) {
    batch.data = geojsonToBinary(batch.data);
    yield batch;
  }
}
