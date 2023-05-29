// loaders.gl, MIT license
// Copyright 2022 Foursquare Labs, Inc.

import {Feature, getTableLength} from '@loaders.gl/schema';
import {Table, TableBatch, getTableRowAsObject} from '@loaders.gl/schema';
import {detectGeometryColumnIndex, getRowPropertyObject} from './encode-utils';
import {Utf8ArrayBufferEncoder} from './utf8-encoder';

type Row = {[key: string]: unknown};

export type GeoJSONWriterOptions = {
  geojson?: {
    featureArray?: boolean;
    geometryColumn?: number | null;
  };
  chunkSize?: number;
};

/**
 * Encode a table as GeoJSON
 */
// eslint-disable-next-line max-statements
export async function* encodeTableAsGeojsonInBatches(
  batchIterator: AsyncIterable<TableBatch>, // | Iterable<TableBatch>,
  inputOpts: GeoJSONWriterOptions = {}
): AsyncIterable<ArrayBuffer> {
  const options: Required<GeoJSONWriterOptions> = {geojson: {}, chunkSize: 10000, ...inputOpts};

  const utf8Encoder = new Utf8ArrayBufferEncoder(options.chunkSize);

  if (!options.geojson.featureArray) {
    utf8Encoder.push('{\n', '"type": "FeatureCollection",\n', '"features":\n');
  }
  utf8Encoder.push('['); // Note no newline

  let geometryColumn = options.geojson.geometryColumn;

  let isFirstLine = true;

  for await (const batch of batchIterator) {
    const {table, start, end = getTableLength(batch.table) - start} = batch;

    // Deduce geometry column if not already done
    if (!geometryColumn) {
      geometryColumn = geometryColumn || detectGeometryColumnIndex(table);
    }

    for (let rowIndex = start; rowIndex < end; ++rowIndex) {
      // Add a comma except on final feature
      if (!isFirstLine) {
        utf8Encoder.push(',');
      }
      utf8Encoder.push('\n');
      isFirstLine = false;

      encodeRow(table, rowIndex, geometryColumn, utf8Encoder);

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

// Helpers

/**
 * Encode a row. Currently this ignores properties in the geometry column.
 */
function encodeRow(
  table: Table,
  rowIndex: number,
  geometryColumnIndex: number,
  utf8Encoder: Utf8ArrayBufferEncoder
): void {
  const row = getTableRowAsObject(table, rowIndex);
  if (!row) return;
  const featureWithProperties = getFeatureFromRow(table, row, geometryColumnIndex);
  const featureString = JSON.stringify(featureWithProperties);
  utf8Encoder.push(featureString);
}

/**
 * Encode a row as a Feature. Currently this ignores properties objects in the geometry column.
 */
function getFeatureFromRow(table: Table, row: Row, geometryColumnIndex: number): Feature {
  // Extract non-feature/geometry properties
  const properties = getRowPropertyObject(table, row, [geometryColumnIndex]);

  // Extract geometry feature
  const columnName = table.schema?.fields[geometryColumnIndex].name;
  let featureOrGeometry =
    columnName && (row[columnName] as {[key: string]: unknown} | string | null | undefined);

  // GeoJSON support null geometries
  if (!featureOrGeometry) {
    // @ts-ignore Feature type does not support null geometries
    return {type: 'Feature', geometry: null, properties};
  }

  // Support string geometries?
  // TODO: This assumes GeoJSON strings, which may not be the correct format
  // (could be WKT, encoded WKB...)
  if (typeof featureOrGeometry === 'string') {
    try {
      featureOrGeometry = JSON.parse(featureOrGeometry);
    } catch (err) {
      throw new Error('Invalid string geometry');
    }
  }

  if (typeof featureOrGeometry !== 'object' || typeof featureOrGeometry?.type !== 'string') {
    throw new Error('invalid geometry column value');
  }

  if (featureOrGeometry?.type === 'Feature') {
    // @ts-ignore Feature type does not support null geometries
    return {...featureOrGeometry, properties};
  }

  // @ts-ignore Feature type does not support null geometries
  return {type: 'Feature', geometry: featureOrGeometry, properties};
}
