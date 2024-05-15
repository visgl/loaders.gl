// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {parseNDJSONSync} from './lib/parsers/parse-ndjson';
import {parseNDJSONInBatches} from './lib/parsers/parse-ndjson-in-batches';
import {ArrayRowTable, ObjectRowTable, Batch} from '@loaders.gl/schema';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for NDGeoJSONLoader */
export type NDGeoJSONLoaderOptions = LoaderOptions & {
  geojson?: {
    shape?: 'object-row-table';
  };
  gis?: {
    format: 'geojson';
  };
};

/** NDGeoJSONLoader */
export const NDJSONLoader = {
  dataType: null as unknown as ArrayRowTable | ObjectRowTable,
  batchType: null as unknown as Batch,

  name: 'NDJSON',
  id: 'ndjson',
  module: 'json',
  version: VERSION,
  extensions: ['ndjson', 'ndgeojson'],
  mimeTypes: [
    'application/geo+x-ndjson',
    'application/geo+x-ldjson',
    'application/jsonlines', // https://docs.aws.amazon.com/sagemaker/latest/dg/cdf-inference.html#cm-batch
    'application/geo+json-seq',
    'application/x-ndjson'
  ],
  category: 'table',
  text: true,
  parse: async (arrayBuffer: ArrayBuffer) => parseNDJSONSync(new TextDecoder().decode(arrayBuffer)),
  parseTextSync: parseNDJSONSync,
  parseInBatches: parseNDJSONInBatches,
  options: {
    geojson: {
      shape: 'object-row-table'
    },
    gis: {
      format: 'geojson'
    }
  }
} as const satisfies LoaderWithParser<
  ArrayRowTable | ObjectRowTable,
  Batch,
  NDGeoJSONLoaderOptions
>;
