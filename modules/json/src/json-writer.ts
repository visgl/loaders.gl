// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright 2022 Foursquare Labs, Inc.

/* global TextEncoder */
import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/loader-utils';
import type {Table, TableBatch} from '@loaders.gl/schema';
import {encodeTableAsJSON} from './lib/encoders/json-encoder';

export type JSONWriterOptions = WriterOptions & {
  json?: {
    shape?: 'object-row-table' | 'array-row-table';
    wrapper?: (table: TableJSON) => unknown;
  };
};

type RowArray = unknown[];
type RowObject = {[key: string]: unknown};
type TableJSON = RowArray[] | RowObject[];

export const JSONWriter = {
  id: 'json',
  version: 'latest',
  module: 'json',
  name: 'JSON',
  extensions: ['json'],
  mimeTypes: ['application/json'],
  options: {},
  text: true,
  encode: async (table: Table, options: JSONWriterOptions) =>
    new TextEncoder().encode(encodeTableAsJSON(table, options)).buffer,
  encodeTextSync: (table: Table, options: JSONWriterOptions) => encodeTableAsJSON(table, options)
} as const satisfies WriterWithEncoder<Table, TableBatch, JSONWriterOptions>;
