// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder} from '@loaders.gl/loader-utils';
import {Table, TableBatch} from '@loaders.gl/schema';
import {ParquetFormat} from './parquet-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type ParquetJSONWriterOptions = {};

export const ParquetJSONWriter = {
  ...ParquetFormat,
  id: 'parquet',
  module: 'parquet',
  version: VERSION,
  options: {},
  encode: async (data, options) => encodeSync(data, options),
  encodeSync
} as const satisfies WriterWithEncoder<Table, TableBatch, ParquetJSONWriterOptions>;

function encodeSync(data, options?: ParquetJSONWriterOptions) {
  return new ArrayBuffer(0);
}
