// loaders.gl, MIT license
// Copyright 2022 Foursquare Labs, Inc.

/* global TextEncoder */
import type {DataWriter} from '@loaders.gl/loader-utils';
import type {Table, TableBatch} from '@loaders.gl/schema';
import type {JSONWriterOptions} from './lib/encoders/json-encoder';
import {encodeTableAsJSON} from './lib/encoders/json-encoder';

export type {JSONWriterOptions};

export const JSONWriter: DataWriter<Table, TableBatch, JSONWriterOptions> = {
  id: 'json',
  version: 'latest',
  module: 'json',
  name: 'JSON',
  extensions: ['json'],
  mimeType: 'application/json',
  options: {},
  text: true,
  encode: async (table: Table, options: JSONWriterOptions) =>
    new TextEncoder().encode(encodeTableAsJSON(table, options)).buffer,
  encodeText: (table: Table, options: JSONWriterOptions) => encodeTableAsJSON(table, options)
};
