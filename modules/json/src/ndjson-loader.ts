import type {Batch} from '@loaders.gl/schema';
import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import parseNDJSONSync from './lib/parse-ndjson';
import parseNDJSONInBatches from './lib/parse-ndjson-in-batches';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const NDJSONLoader = {
  name: 'NDJSON',
  id: 'ndjson',
  module: 'json',
  version: VERSION,
  extensions: ['ndjson'],
  mimeTypes: ['application/x-ndjson'],
  category: 'table',
  text: true,
  parse,
  parseTextSync,
  parseInBatches,
  options: {}
};

async function parse(arrayBuffer: ArrayBuffer) {
  return parseTextSync(new TextDecoder().decode(arrayBuffer));
}

function parseTextSync(text: string) {
  return parseNDJSONSync(text);
}

function parseInBatches(
  asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
  options?: LoaderOptions
): AsyncIterable<Batch> {
  return parseNDJSONInBatches(asyncIterator, options);
}

export const _typecheckNDJSONLoader: LoaderWithParser = NDJSONLoader;
