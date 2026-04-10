// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {ObjectRowTable, ArrayRowTable, TableBatch} from '@loaders.gl/schema';
import {parseNDJSONSync} from './lib/parsers/parse-ndjson';
import {parseNDJSONInBatches} from './lib/parsers/parse-ndjson-in-batches';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const NDJSONLoader = {
  dataType: null as unknown as ArrayRowTable | ObjectRowTable,
  batchType: null as unknown as TableBatch,

  name: 'NDJSON',
  id: 'ndjson',
  module: 'json',
  version: VERSION,
  extensions: ['ndjson', 'jsonl'],
  mimeTypes: [
    'application/x-ndjson',
    'application/jsonlines', // https://docs.aws.amazon.com/sagemaker/latest/dg/cdf-inference.html#cm-batch
    'application/json-seq'
  ],
  category: 'table',
  text: true,
  parse: async (arrayBuffer: ArrayBuffer) => parseNDJSONSync(new TextDecoder().decode(arrayBuffer)),
  parseTextSync: parseNDJSONSync,
  parseInBatches: parseNDJSONInBatches,
  options: {}
} as const satisfies LoaderWithParser<ObjectRowTable | ArrayRowTable, TableBatch, LoaderOptions>;
