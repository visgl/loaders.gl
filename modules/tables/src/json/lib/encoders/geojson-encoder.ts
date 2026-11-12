// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright 2022 Foursquare Labs, Inc.

import type {RecordBatch} from 'apache-arrow';
import {isNativeWriterTable, type TableWriterInput} from '../../../arrow/table-writer-input';
import {convertArrowToSchema, getTableLength} from '@loaders.gl/core/schema-utils';
import {detectGeometryColumnIndex} from '../encoder-utils/encode-utils';
import {encodeTableRow} from '../encoder-utils/encode-table-row';
import {Utf8ArrayBufferEncoder} from '../encoder-utils/utf8-encoder';
import type {GeoJSONWriterOptions} from '../../geojson-writer';

/**
 * Encode a table as GeoJSON
 */
// eslint-disable-next-line max-statements
export async function* encodeTableAsGeojsonInBatches(
  batchIterator:
    | AsyncIterable<TableWriterInput | RecordBatch>
    | Iterable<TableWriterInput | RecordBatch>,
  inputOpts: GeoJSONWriterOptions = {}
): AsyncIterable<ArrayBuffer> {
  // @ts-expect-error
  const options: Required<GeoJSONWriterOptions> = {geojson: {}, chunkSize: 10000, ...inputOpts};

  const utf8Encoder = new Utf8ArrayBufferEncoder(options.chunkSize);

  if (!options.geojson.featureArray) {
    utf8Encoder.push('{\n', '"type": "FeatureCollection",\n', '"features":\n');
  }
  utf8Encoder.push('['); // Note no newline

  let geometryColumn = options.geojson.geometryColumn;

  let isFirstLine = true;

  for await (const input of batchIterator) {
    const tableBatch =
      'shape' in input && !isNativeWriterTable(input)
        ? input
        : {
            shape: 'object-row-table' as const,
            schema: convertArrowToSchema(input.schema),
            data: Array.from(input, row => row.toJSON())
          };
    const length = getTableLength(tableBatch);
    if (length === 0) {
      continue;
    }
    geometryColumn ??= detectGeometryColumnIndex(tableBatch);

    for (let rowIndex = 0; rowIndex < length; ++rowIndex) {
      // Add a comma except on final feature
      if (!isFirstLine) {
        utf8Encoder.push(',');
      }
      utf8Encoder.push('\n');
      isFirstLine = false;

      encodeTableRow(tableBatch, rowIndex, geometryColumn, utf8Encoder);

      // eslint-disable-next-line max-depth
      if (utf8Encoder.isFull()) {
        yield utf8Encoder.getArrayBufferBatch();
      }
    }

    const arrayBufferBatch = utf8Encoder.getArrayBufferBatch();
    if (arrayBufferBatch.byteLength > 0) {
      yield arrayBufferBatch;
    }
  }

  utf8Encoder.push('\n');

  // Add completing rows and emit final batch
  utf8Encoder.push(']\n');
  if (!options.geojson.featureArray) {
    utf8Encoder.push('}');
  }

  // Note: Since we pushed a few final lines, the last batch will always exist, no need to check first
  yield utf8Encoder.getArrayBufferBatch();
}
