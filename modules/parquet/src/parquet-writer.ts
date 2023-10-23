// loaders.gl, MIT license

import type {Writer} from '@loaders.gl/loader-utils';
import {Table, TableBatch} from '@loaders.gl/schema';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type ParquetWriterOptions = {};

export const ParquetWriter: Writer<Table, TableBatch, ParquetWriterOptions> = {
  name: 'Apache Parquet',
  id: 'parquet',
  module: 'parquet',
  version: VERSION,
  extensions: ['parquet'],
  mimeTypes: ['application/octet-stream'],
  encodeSync,
  binary: true,
  options: {}
};

function encodeSync(data, options?: ParquetWriterOptions) {
  return new ArrayBuffer(0);
}
