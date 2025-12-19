// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright Foursquare, Inc 20222

import {
  type WriterWithEncoder,
  type WriterOptions,
  concatenateArrayBuffersAsync
} from '@loaders.gl/loader-utils';
import type {Table, TableBatch} from '@loaders.gl/schema';
import {encodeTableAsGeojsonInBatches} from './lib/encoders/geojson-encoder';

export type GeoJSONWriterOptions = WriterOptions & {
  geojson?: {
    featureArray?: boolean;
    geometryColumn?: number | null;
  };
  chunkSize?: number;
};

export const GeoJSONWriter = {
  id: 'geojson',
  version: 'latest',
  module: 'geojson',
  name: 'GeoJSON',
  extensions: ['geojson'],
  mimeTypes: ['application/geo+json'],
  text: true,
  options: {
    geojson: {
      featureArray: false,
      geometryColumn: null
    }
  },

  async encode(table: Table, options: GeoJSONWriterOptions): Promise<ArrayBuffer> {
    const tableIterator = [table] as TableBatch[];
    const batches = encodeTableAsGeojsonInBatches(tableIterator, options);
    return await concatenateArrayBuffersAsync(batches);
  },

  encodeInBatches: (tableIterator: AsyncIterable<TableBatch> | Iterable<TableBatch>, options) =>
    encodeTableAsGeojsonInBatches(tableIterator, options)
} as const satisfies WriterWithEncoder<Table, TableBatch, GeoJSONWriterOptions>;
