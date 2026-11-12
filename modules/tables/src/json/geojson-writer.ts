// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright Foursquare, Inc 20222

import {
  type WriterWithEncoder,
  type WriterOptions,
  concatenateArrayBuffersAsync
} from '@loaders.gl/core/loader-utils';
import type {RecordBatch} from 'apache-arrow';
import type {TableWriterInput, TableWriterBatch} from '../arrow/table-writer-input';
import {encodeTableAsGeojsonInBatches} from './lib/encoders/geojson-encoder';
import {GeoJSONFormat} from './json-format';

export type GeoJSONWriterOptions = WriterOptions & {
  geojson?: {
    featureArray?: boolean;
    geometryColumn?: number | null;
  };
  chunkSize?: number;
};

export const GeoJSONWriter = {
  ...GeoJSONFormat,
  version: 'latest',
  text: true,
  options: {
    geojson: {
      featureArray: false,
      geometryColumn: null
    }
  },

  async encode(table: TableWriterInput, options: GeoJSONWriterOptions): Promise<ArrayBuffer> {
    const batches = encodeTableAsGeojsonInBatches([table], options);
    return await concatenateArrayBuffersAsync(batches);
  },

  encodeInBatches: (
    tableIterator:
      | AsyncIterable<TableWriterBatch | RecordBatch>
      | Iterable<TableWriterBatch | RecordBatch>,
    options
  ) => encodeTableAsGeojsonInBatches(tableIterator, options)
} as const satisfies WriterWithEncoder<
  TableWriterInput,
  TableWriterBatch | RecordBatch,
  GeoJSONWriterOptions
>;
