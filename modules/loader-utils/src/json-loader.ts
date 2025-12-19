import type {LoaderWithParser, LoaderOptions} from './loader-types';
import type {Table, TableBatch} from '@loaders.gl/schema';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type JSONLoaderOptions = LoaderOptions;

/**
 * A JSON Micro loader (minimal bundle size)
 * Alternative to `@loaders.gl/json`
 */
export const JSONLoader = {
  dataType: null as unknown as Table,
  batchType: null as unknown as TableBatch,
  name: 'JSON',
  id: 'json',
  module: 'json',
  version: VERSION,
  extensions: ['json', 'geojson'],
  mimeTypes: ['application/json'],
  category: 'json',
  text: true,
  parseTextSync,
  parse: async (arrayBuffer) => parseTextSync(new TextDecoder().decode(arrayBuffer)),
  options: {}
} as const satisfies LoaderWithParser<Table, TableBatch, JSONLoaderOptions>;

// TODO - Better error handling!
function parseTextSync(text) {
  return JSON.parse(text);
}
