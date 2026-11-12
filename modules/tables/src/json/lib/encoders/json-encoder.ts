// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright 2022 Foursquare Labs, Inc.

import type {Table as ArrowTable} from 'apache-arrow';
import {convertWKBToGeometry} from '@loaders.gl/core/arrow-geometry/geometry-codecs';
import type {Field, Schema} from '@loaders.gl/core/schema';
import {convertArrowToSchema, makeRowIterator} from '@loaders.gl/core/schema-utils';
import {isNativeWriterTable, type TableWriterInput} from '../../../arrow/table-writer-input';
import type {JSONWriterOptions} from '../../json-writer';

type GeoArrowWKBField = {
  /** Zero-based field index for array-row output. */
  index: number;
  /** Field name for object-row output. */
  name: string;
};

/**
 * Encode a table as a JSON string
 */
export function encodeTableAsJSON(table: TableWriterInput, options?: JSONWriterOptions): string {
  const shape = options?.json?.shape || 'object-row-table';

  const strings: string[] = [];
  const native = isNativeWriterTable(table);
  const schema = native ? convertArrowToSchema(table.schema) : table.schema;
  const geoArrowWKBFields =
    (options?.json?.geoarrow || 'auto') === 'auto' && schema ? getGeoArrowWKBFields(schema) : [];
  const rows = native ? makeNativeRows(table, shape) : makeRowIterator(table, shape);
  for (const row of rows) {
    strings.push(JSON.stringify(decodeGeoArrowWKBRow(row, shape, geoArrowWKBFields)));
  }
  return `[${strings.join(',')}]`;
}

/** Iterates native rows in the JSON writer's requested row shape. */
function* makeNativeRows(table: ArrowTable, shape: 'array-row-table' | 'object-row-table') {
  for (const row of table) {
    yield shape === 'array-row-table' ? row.toArray() : row.toJSON();
  }
}

/** Returns GeoArrow WKB fields declared by a table schema. */
function getGeoArrowWKBFields(schema: Schema): GeoArrowWKBField[] {
  const geometryColumns = getGeoMetadataWKBColumns(schema);

  return schema.fields.flatMap((field, index) =>
    isGeoArrowWKBField(field, geometryColumns) ? [{index, name: field.name}] : []
  );
}

/** Returns geometry column names declared as WKB in GeoArrow metadata. */
function getGeoMetadataWKBColumns(schema: Schema): Set<string> {
  const geoMetadata = schema.metadata?.geo;
  const geometryColumns = new Set<string>();

  if (!geoMetadata) {
    return geometryColumns;
  }

  try {
    const parsedMetadata = JSON.parse(geoMetadata);
    for (const [columnName, columnMetadata] of Object.entries(parsedMetadata.columns || {})) {
      if ((columnMetadata as {encoding?: unknown}).encoding === 'wkb') {
        geometryColumns.add(columnName);
      }
    }
  } catch {
    // Ignore invalid metadata and rely on field-level extension metadata.
  }

  return geometryColumns;
}

/** Returns true when one schema field represents a GeoArrow WKB geometry column. */
function isGeoArrowWKBField(field: Field, geometryColumns: Set<string>): boolean {
  return (
    field.metadata?.['ARROW:extension:name'] === 'geoarrow.wkb' || geometryColumns.has(field.name)
  );
}

/** Decodes all GeoArrow WKB geometry values in one row. */
function decodeGeoArrowWKBRow(
  row: unknown[] | {[key: string]: unknown},
  shape: 'object-row-table' | 'array-row-table',
  geoArrowWKBFields: GeoArrowWKBField[]
): unknown[] | {[key: string]: unknown} {
  if (geoArrowWKBFields.length === 0) {
    return row;
  }

  if (shape === 'array-row-table') {
    const decodedRow = [...(row as unknown[])];
    for (const field of geoArrowWKBFields) {
      decodedRow[field.index] = decodeGeoArrowWKBValue(decodedRow[field.index]);
    }
    return decodedRow;
  }

  const decodedRow = {...(row as {[key: string]: unknown})};
  for (const field of geoArrowWKBFields) {
    decodedRow[field.name] = decodeGeoArrowWKBValue(decodedRow[field.name]);
  }
  return decodedRow;
}

/** Decodes one GeoArrow WKB byte value to a GeoJSON geometry. */
function decodeGeoArrowWKBValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof ArrayBuffer) {
    return convertWKBToGeometry(value);
  }

  if (ArrayBuffer.isView(value)) {
    return convertWKBToGeometry(
      value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength)
    );
  }

  return value;
}
