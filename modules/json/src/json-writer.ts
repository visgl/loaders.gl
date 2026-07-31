// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright 2022 Foursquare Labs, Inc.

/* global TextEncoder */
import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/loader-utils';
import type {Table, TableBatch} from '@loaders.gl/schema';
import {encodeTableAsJSON} from './lib/encoders/json-encoder';
import {JSONFormat} from './json-format';

export type JSONWriterOptions = WriterOptions & {
  /** JSON writer options. */
  json?: {
    /** Requested row shape to serialize. */
    shape?: 'object-row-table' | 'array-row-table' | 'arrow-table';
    /** Whether GeoArrow WKB geometry columns should be decoded to GeoJSON geometries. */
    geoarrow?: 'auto' | 'none';
    wrapper?: (table: TableJSON) => unknown;
  };
};

type RowArray = unknown[];
type RowObject = {[key: string]: unknown};
type TableJSON = RowArray[] | RowObject[];

export const JSONWriter = {
  ...JSONFormat,
  version: 'latest',
  options: {},
  text: true,
  encode: async (table: Table, options: JSONWriterOptions) =>
    new TextEncoder().encode(encodeTableAsJSON(table, options)).buffer,
  encodeTextSync: (table: Table, options: JSONWriterOptions) => encodeTableAsJSON(table, options)
} as const satisfies WriterWithEncoder<Table, TableBatch, JSONWriterOptions>;
