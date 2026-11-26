// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright 2022 Foursquare Labs, Inc.

/* global TextEncoder */
import type {TableWriterInput, TableWriterBatch} from '../arrow/table-writer-input';
import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/core/loader-utils';
import {encodeTableAsJSON} from './lib/encoders/json-encoder';
import {JSON_WRITER_METADATA} from './json-writer-types';

export type JSONWriterOptions = WriterOptions & {
  /** JSON writer options. */
  json?: {
    /** Requested row shape to serialize. */
    shape?: 'object-row-table' | 'array-row-table';
    /** Whether GeoArrow WKB geometry columns should be decoded to GeoJSON geometries. */
    geoarrow?: 'auto' | 'none';
    wrapper?: (table: TableJSON) => unknown;
  };
};

type RowArray = unknown[];
type RowObject = {[key: string]: unknown};
type TableJSON = RowArray[] | RowObject[];

export const JSONWriter = {
  ...JSON_WRITER_METADATA,
  encode: async (table: TableWriterInput, options: JSONWriterOptions) =>
    new TextEncoder().encode(encodeTableAsJSON(table, options)).buffer,
  encodeTextSync: (table: TableWriterInput, options: JSONWriterOptions) =>
    encodeTableAsJSON(table, options)
} as const satisfies WriterWithEncoder<TableWriterInput, TableWriterBatch, JSONWriterOptions>;
