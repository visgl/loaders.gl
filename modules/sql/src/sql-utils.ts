// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {ArrowTable, DataType, Field, ObjectRowTable, Schema} from '@loaders.gl/schema';
import {makeTableFromData, getDataTypeFromArray} from '@loaders.gl/schema-utils';

import type {SQLColumnInfo} from './sql-types';

/** Returns true when the current runtime is Node.js. */
export function isNodeRuntime(): boolean {
  return typeof process !== 'undefined' && Boolean(process.versions?.node);
}

/** Escapes a SQL string literal using single-quote doubling. */
export function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

/** Wraps an identifier in double quotes, escaping embedded quotes. */
export function quoteSqlIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

/** Converts object rows into a loaders.gl Arrow table. */
export function convertRowsToArrowTable(rows: Record<string, unknown>[]): ArrowTable {
  const table: ObjectRowTable =
    rows.length > 0
      ? makeTableFromData(rows)
      : {shape: 'object-row-table', schema: {fields: [], metadata: {}}, data: rows};
  const schema = deducePrimitiveAwareSchema(table);

  if (table.data.length === 0 || schema.fields.length === 0) {
    return {
      shape: 'arrow-table',
      schema,
      data: new arrow.Table(new arrow.Schema([]))
    };
  }

  return {
    shape: 'arrow-table',
    schema,
    data: arrow.tableFromJSON(table.data)
  };
}

/** Converts normalized SQL columns into a loaders.gl schema. */
export function convertSQLColumnsToSchema(columns: SQLColumnInfo[]): Schema {
  return {
    metadata: {},
    fields: columns
      .sort((left, right) => (left.ordinalPosition || 0) - (right.ordinalPosition || 0))
      .map(column => ({
        name: column.columnName,
        type: mapSQLTypeToDataType(column.sqlType),
        nullable: column.nullable,
        metadata: {
          sqlType: column.sqlType
        }
      }))
  };
}

function mapSQLTypeToDataType(sqlType: string): DataType {
  const normalizedType = sqlType.toUpperCase();
  if (
    normalizedType.includes('BIGINT') ||
    normalizedType === 'HUGEINT' ||
    normalizedType === 'LONG'
  ) {
    return 'int64';
  }
  if (
    normalizedType.includes('INT') ||
    normalizedType === 'INTEGER' ||
    normalizedType === 'SMALLINT' ||
    normalizedType === 'TINYINT'
  ) {
    return 'int32';
  }
  if (
    normalizedType.includes('DOUBLE') ||
    normalizedType.includes('FLOAT8') ||
    normalizedType.includes('REAL')
  ) {
    return 'float64';
  }
  if (
    normalizedType.includes('FLOAT') ||
    normalizedType.includes('DECIMAL') ||
    normalizedType.includes('NUMERIC')
  ) {
    return 'float64';
  }
  if (normalizedType.includes('BOOL')) {
    return 'bool';
  }
  if (normalizedType.includes('DATE')) {
    return 'date-day';
  }
  if (normalizedType.includes('TIME') || normalizedType.includes('TIMESTAMP')) {
    return 'timestamp-millisecond';
  }
  if (normalizedType.includes('BLOB') || normalizedType.includes('BINARY')) {
    return 'binary';
  }
  return 'utf8';
}

function deducePrimitiveAwareSchema(table: ObjectRowTable): Schema {
  return {
    ...table.schema!,
    fields: table.schema!.fields.map((field): Field => {
      if (field.type !== 'null') {
        return field;
      }

      const columnValues = table.data.map(row => row[field.name]);
      const inferredType = getDataTypeFromArray(columnValues);
      return {...field, type: inferredType.type, nullable: inferredType.nullable};
    })
  };
}

/** Returns a fully qualified SQL object name. */
export function getQualifiedTableName(options: {
  catalogName?: string;
  schemaName?: string;
  tableName: string;
}): string {
  const identifiers = [options.catalogName, options.schemaName, options.tableName].filter(
    (value): value is string => Boolean(value)
  );
  return identifiers.map(identifier => quoteSqlIdentifier(identifier)).join('.');
}
