// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright 2022 Foursquare Labs, Inc.

import type {TableBatch} from '@loaders.gl/schema';
import {getTableLength} from '@loaders.gl/schema';
import {detectGeometryColumnIndex} from '../encoder-utils/encode-utils';
import {encodeTableRow} from '../encoder-utils/encode-table-row';
import {Utf8ArrayBufferEncoder} from '../encoder-utils/utf8-encoder';
import type {GeoJSONWriterOptions} from '../../geojson-writer';

/**
 * Encode a table as GeoJSON
 */
// eslint-disable-next-line max-statements
export async function* encodeTableAsGeojsonInBatches(
  batchIterator: AsyncIterable<TableBatch> | Iterable<TableBatch>, // | Iterable<TableBatch>,
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

  let start = 0;
  for await (const tableBatch of batchIterator) {
    const end = start + getTableLength(tableBatch);

    // Deduce geometry column if not already done
    if (!geometryColumn) {
      geometryColumn = geometryColumn || detectGeometryColumnIndex(tableBatch);
    }

    for (let rowIndex = start; rowIndex < end; ++rowIndex) {
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

      start = end;
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
