// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {AvroSchema} from './parse-avro';

/** Builds Arrow vectors with schema-defined binary types instead of inferring byte indices. */
export function createAvroTable(
  rows: Record<string, unknown>[],
  schema: AvroSchema,
  longType: 'number' | 'bigint' = 'number'
): arrow.Table {
  const namedTypes = new Map<string, AvroSchema>();
  registerTypes(schema, namedTypes);
  const type = createArrowType(schema, rows, namedTypes, new Set(), longType);
  if (!arrow.DataType.isStruct(type)) throw new Error('Avro root schema must be a record');
  const vector = arrow.vectorFromArray(
    rows.map(row => normalizeArrowValue(row, type)),
    type
  );
  return new arrow.Table(
    vector.data.map(data => new arrow.RecordBatch(new arrow.Schema(type.children), data))
  );
}

/** Combines Arrow batches without spreading an unbounded number of function arguments. */
export function concatenateAvroTables(tables: arrow.Table[]): arrow.Table {
  return new arrow.Table(tables.flatMap(table => table.batches));
}

/** Registers definitions used by named record, enum, and fixed references. */
function registerTypes(schema: AvroSchema, namedTypes: Map<string, AvroSchema>): void {
  if (typeof schema === 'string') return;
  if (Array.isArray(schema)) {
    for (const branch of schema) registerTypes(branch, namedTypes);
    return;
  }
  if (schema.name) namedTypes.set(schema.name, schema);
  if (typeof schema.type !== 'string') registerTypes(schema.type, namedTypes);
  for (const field of schema.fields || []) registerTypes(field.type, namedTypes);
  if (schema.items) registerTypes(schema.items, namedTypes);
  if (schema.values) registerTypes(schema.values, namedTypes);
}

/** Recognizes null branches in both primitive-name and schema-object form. */
function isNullSchema(schema: AvroSchema): boolean {
  if (typeof schema === 'string') return schema === 'null';
  return !Array.isArray(schema) && isNullSchema(schema.type);
}

/** Maps Avro schemas recursively while retaining existing numeric and logical representations. */
function createArrowType(
  schema: AvroSchema,
  values: unknown[],
  namedTypes: Map<string, AvroSchema>,
  ancestors: Set<AvroSchema>,
  longType: 'number' | 'bigint'
): arrow.DataType {
  if (Array.isArray(schema)) {
    const branches = schema.filter(branch => !isNullSchema(branch));
    if (branches.length === 1)
      return createArrowType(branches[0], values, namedTypes, ancestors, longType);
    return arrow.vectorFromArray(values).type;
  }
  if (typeof schema === 'string') {
    const named = namedTypes.get(schema);
    if (named) return createArrowType(named, values, namedTypes, ancestors, longType);
    switch (schema) {
      case 'bytes':
        return new arrow.Binary();
      case 'string':
        return new arrow.Utf8();
      case 'boolean':
        return new arrow.Bool();
      case 'null':
        return new arrow.Null();
      case 'int':
      case 'float':
      case 'double':
        return new arrow.Float64();
      case 'long':
        return longType === 'bigint' ? new arrow.Int64() : new arrow.Float64();
      default:
        return arrow.vectorFromArray(values).type;
    }
  }
  // Match decoded logical values without making their types depend on a batch's first row.
  switch (schema.logicalType) {
    case 'decimal':
      return new arrow.Float64();
    case 'big-decimal':
      return new arrow.Struct([
        new arrow.Field('value', new arrow.Float64(), true),
        new arrow.Field('scale', new arrow.Float64(), true)
      ]);
    case 'duration':
      return new arrow.Struct([
        new arrow.Field('months', new arrow.Float64(), true),
        new arrow.Field('days', new arrow.Float64(), true),
        new arrow.Field('milliseconds', new arrow.Float64(), true)
      ]);
    case 'date':
    case 'timestamp-millis':
    case 'timestamp-micros':
      return new arrow.TimestampMillisecond();
  }
  if (ancestors.has(schema)) return arrow.vectorFromArray(values).type;
  const descendants = new Set(ancestors).add(schema);
  if (schema.type === 'record') {
    return new arrow.Struct(
      (schema.fields || []).map(
        field =>
          new arrow.Field(
            field.name,
            createArrowType(
              field.type,
              values.map(value => (value as Record<string, unknown> | null)?.[field.name]),
              namedTypes,
              descendants,
              longType
            ),
            true
          )
      )
    );
  }
  if (schema.type === 'fixed') return new arrow.FixedSizeBinary(schema.size || 0);
  if (schema.type === 'enum') return new arrow.Utf8();
  if (schema.type === 'array') {
    return new arrow.List(
      new arrow.Field(
        'item',
        createArrowType(
          schema.items as AvroSchema,
          values.flatMap(value => (Array.isArray(value) ? value : [])),
          namedTypes,
          descendants,
          longType
        ),
        true
      )
    );
  }
  if (schema.type === 'map') {
    return new arrow.Map_(
      new arrow.Field(
        'entries',
        new arrow.Struct<{key: arrow.Utf8; value: arrow.DataType}>([
          new arrow.Field('key', new arrow.Utf8(), false),
          new arrow.Field(
            'value',
            createArrowType(
              schema.values as AvroSchema,
              values.flatMap(value => (value instanceof Map ? [...value.values()] : [])),
              namedTypes,
              descendants,
              longType
            ),
            true
          )
        ]),
        false
      ),
      false
    );
  }
  return createArrowType(schema.type, values, namedTypes, descendants, longType);
}

/** Converts Avro JSON defaults and nested containers to the values expected by Arrow builders. */
function normalizeArrowValue(value: unknown, type: arrow.DataType): unknown {
  if (value === null || value === undefined) return value;
  if (
    (arrow.DataType.isBinary(type) || arrow.DataType.isFixedSizeBinary(type)) &&
    typeof value === 'string'
  ) {
    return Uint8Array.from(value, character => character.charCodeAt(0));
  }
  if (arrow.DataType.isInt(type) && type.bitWidth === 64 && typeof value === 'number') {
    return BigInt(value);
  }
  if (arrow.DataType.isStruct(type)) {
    return Object.fromEntries(
      type.children.map(field => [
        field.name,
        normalizeArrowValue((value as Record<string, unknown>)[field.name], field.type)
      ])
    );
  }
  if (arrow.DataType.isList(type) && Array.isArray(value)) {
    return value.map(item => normalizeArrowValue(item, type.valueType));
  }
  if (arrow.DataType.isMap(type)) {
    const entries =
      value instanceof Map ? value.entries() : Object.entries(value as Record<string, unknown>);
    return new Map(
      Array.from(entries, ([key, item]) => [key, normalizeArrowValue(item, type.valueType)])
    );
  }
  return value;
}
