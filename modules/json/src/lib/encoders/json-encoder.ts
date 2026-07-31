// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright 2022 Foursquare Labs, Inc.

import {convertWKBToGeometry} from '@loaders.gl/gis';
import type {Field, Schema, Table} from '@loaders.gl/schema';
import {convertArrowToSchema, makeRowIterator} from '@loaders.gl/schema-utils';
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
export function encodeTableAsJSON(table: Table, options?: JSONWriterOptions): string {
  const shape =
    options?.json?.shape === 'arrow-table'
      ? 'object-row-table'
      : options?.json?.shape || 'object-row-table';

  const strings: string[] = [];
  const geoArrowWKBFields =
    (options?.json?.geoarrow || 'auto') === 'auto' ? getGeoArrowWKBFields(table) : [];
  const rowIterator = makeRowIterator(table, shape);
  for (const row of rowIterator) {
    // Round elements etc
    // processRow(wrappedRow, table.schema);
    // const wrappedRow = options.wrapper ? options.wrapper(row) : row;
    strings.push(JSON.stringify(decodeGeoArrowWKBRow(row, shape, geoArrowWKBFields)));
  }
  return `[${strings.join(',')}]`;
}

/** Returns GeoArrow WKB fields declared by a table schema. */
function getGeoArrowWKBFields(table: Table): GeoArrowWKBField[] {
  const schema = getTableSchema(table);
  const geometryColumns = getGeoMetadataWKBColumns(schema);

  return schema.fields.flatMap((field, index) =>
    isGeoArrowWKBField(field, geometryColumns) ? [{index, name: field.name}] : []
  );
}

/** Returns a loaders.gl schema for plain and Arrow table inputs. */
function getTableSchema(table: Table): Schema {
  if (table.schema) {
    return table.schema;
  }

  if (table.shape === 'arrow-table') {
    return convertArrowToSchema(table.data.schema);
  }

  return {fields: [], metadata: {}};
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
