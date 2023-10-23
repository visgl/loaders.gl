// loaders.gl, MIT license
// Copyright Foursquare, Inc 20222

import type {Writer, WriterOptions} from '@loaders.gl/loader-utils';
import type {Table, TableBatch} from '@loaders.gl/schema';
import {encodeTableAsGeojsonInBatches} from './lib/encoders/geojson-encoder';

export type GeoJSONWriterOptions = WriterOptions & {
  geojson?: {
    featureArray?: boolean;
    geometryColumn?: number | null;
  };
  chunkSize?: number;
};

export const GeoJSONWriter: Writer<Table, TableBatch, GeoJSONWriterOptions> = {
  id: 'geojson',
  version: 'latest',
  module: 'geojson',
  name: 'GeoJSON',
  extensions: ['geojson'],
  mimeTypes: ['application/geo+json'],
  options: {
    geojson: {
      featureArray: false,
      geometryColumn: null
    }
  },
  text: true,
  encodeInBatches: (tableIterator: AsyncIterable<TableBatch>, options) =>
    encodeTableAsGeojsonInBatches(tableIterator, options)
};
