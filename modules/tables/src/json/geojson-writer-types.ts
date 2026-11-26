// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {RecordBatch} from 'apache-arrow';
import type {TableWriterInput, TableWriterBatch} from '../arrow/table-writer-input';
import {GeoJSONFormat} from './json-format';
import type {GeoJSONWriterOptions} from './geojson-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

/** Shared GeoJSONWriter metadata and defaults. */
export const GEO_JSON_WRITER_METADATA = {
  ...GeoJSONFormat,
  version: 'latest',
  text: true,
  options: {
    geojson: {
      featureArray: false,
      geometryColumn: null
    }
  }
} as const satisfies Writer<TableWriterInput, TableWriterBatch | RecordBatch, GeoJSONWriterOptions>;

/** Metadata for encoding with GeoJSONWriter through the core APIs. */
export const GeoJSONWriter = {
  ...GEO_JSON_WRITER_METADATA,
  dataType: null as unknown as TableWriterInput,
  batchType: null as unknown as TableWriterBatch | RecordBatch,
  options: GEO_JSON_WRITER_METADATA.options as GeoJSONWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {GeoJSONWriter} = await import('./geojson-writer.js');
    return GeoJSONWriter;
  }
} as const satisfies Writer<TableWriterInput, TableWriterBatch | RecordBatch, GeoJSONWriterOptions>;
