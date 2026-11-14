// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {RecordBatch, Struct, Table, makeData, vectorFromArray} from 'apache-arrow';
import {
  createQueryMetadata,
  executeTableScanBatches,
  makeTableScanBatch,
  validateTableQueryLimit,
  type TableQuerySource,
  type TableQueryPushdownRequest,
  type TableQueryReadOptions
} from '@loaders.gl/core/loader-utils';
import {filterArrowTable} from '@loaders.gl/core/query/arrow-execution';
import type {ArrowTableBatch, Field, Schema} from '@loaders.gl/core/schema';
import {convertSchemaToArrow, makeArrowMetadataBatch} from '@loaders.gl/core/schema-utils';
import type {DuckDBSQLDataSource} from './duckdb-sql-source';
import type {SQLTableInfo} from './sql-types';
import {getQualifiedTableName, quoteSqlIdentifier} from './sql-utils';

/** Maps supported DuckDB scalars to their exact Arrow storage types. */
const SCALAR_TYPES: Readonly<Record<string, Field['type']>> = {
  TINYINT: 'int8',
  SMALLINT: 'int16',
  INTEGER: 'int32',
  BIGINT: 'int64',
  FLOAT: 'float32',
  REAL: 'float32',
  DOUBLE: 'float64',
  BOOLEAN: 'bool',
  VARCHAR: 'utf8'
};

/** Signed integer widths and corresponding DuckDB CAST targets. */
const INTEGER_TYPES = {int8: 'TINYINT', int16: 'SMALLINT', int32: 'INTEGER', int64: 'BIGINT'};

/** Returns the SQL type of a signed integer field when it is eligible for exact casts. */
function getIntegerType(type: Field['type']): string | undefined {
  return typeof type === 'string' && Object.hasOwn(INTEGER_TYPES, type)
    ? INTEGER_TYPES[type as keyof typeof INTEGER_TYPES]
    : undefined;
}

/** Reports whether all fields have exact Arrow storage representations. */
export function isDuckDBQuerySchema(schema: Schema): boolean {
  return (
    schema.fields.length > 0 &&
    schema.fields.every(field => Object.hasOwn(SCALAR_TYPES, field.metadata?.sqlType || ''))
  );
}

/** Creates a reusable table handle with a schema snapshot and a lazy row reader. */
export function makeDuckDBTableQuerySource(
  source: DuckDBSQLDataSource,
  table: SQLTableInfo,
  sourceSchema: Schema
): TableQuerySource {
  if (!isDuckDBQuerySchema(sourceSchema))
    throw new Error('Unsupported DuckDB table schema for the common query API');
  const schema = {
    ...sourceSchema,
    fields: sourceSchema.fields.map(field => {
      const type = SCALAR_TYPES[field.metadata?.sqlType || ''];
      if (!type) throw new Error(`Unsupported DuckDB query field type: ${field.metadata?.sqlType}`);
      return {...field, type};
    })
  };
  const tableName = `${getQualifiedTableName(table)} AS query_input`;
  const ordered =
    table.tableType === 'BASE TABLE' &&
    !schema.fields.some(field => field.name.toLowerCase() === 'rowid');
  const order = ordered ? ' ORDER BY query_input.rowid' : '';
  const metadata = createQueryMetadata({
    sourceType: 'duckdb-table',
    queryType: 'table',
    execution: {status: 'supported', method: 'read'},
    schema,
    queryCapabilities: {
      table: {
        projection: 'pushdown',
        predicate: 'pushdown+residual',
        cast: 'pushdown',
        offset: ordered ? 'pushdown' : 'residual',
        limit: ordered ? 'pushdown' : 'residual',
        streaming: false,
        cancellation: false
      }
    }
  });

  /** Reads typed rows without relying on inference for BIGINT, null-only, or empty columns. */
  async function* readStatement(sql: string, outputSchema: Schema, signal?: AbortSignal) {
    signal?.throwIfAborted();
    const rows = await source.queryRows(sql, {signal});
    signal?.throwIfAborted();
    const arrowSchema = convertSchemaToArrow(outputSchema);
    const vectors = arrowSchema.fields.map((field, index) =>
      vectorFromArray(
        rows.map(row => {
          const value = row[field.name];
          if (value == null) return null;
          const type = outputSchema.fields[index].type;
          if (type === 'int64') return BigInt(value as string | bigint);
          if (type === 'float32' || type === 'float64') return Number(value);
          return value;
        }),
        field.type
      )
    );
    yield new RecordBatch(
      arrowSchema,
      makeData({
        type: new Struct(arrowSchema.fields),
        length: rows.length,
        children: vectors.map(vector => vector.data[0])
      })
    );
  }

  /** Compiles the exact subset without evaluating data or changing the connection. */
  function plan(
    query: Omit<TableQueryPushdownRequest, 'where'> & {
      where?: TableQueryPushdownRequest['where'] | TableQueryReadOptions['predicate'];
    }
  ) {
    validateTableQueryLimit(query.limit);
    if (query.offset !== undefined && (!Number.isSafeInteger(query.offset) || query.offset < 0)) {
      throw new Error('DuckDB query offset must be a non-negative safe integer.');
    }
    const selections = query.select ?? schema.fields.map(field => field.name);
    const columns: string[] = [];
    const fields: Field[] = [];
    for (const [index, selection] of selections.entries()) {
      const expression =
        typeof selection !== 'string' && 'expression' in selection
          ? selection.expression
          : undefined;
      if (typeof selection !== 'string' && 'array' in selection) return null;
      const cast =
        expression?.type === 'CallExpression' &&
        expression.callee.type === 'Identifier' &&
        expression.callee.name === 'cast'
          ? expression.arguments
          : undefined;
      const column =
        typeof selection === 'string'
          ? selection
          : 'column' in selection
            ? selection.column
            : cast?.[0]?.type === 'Identifier'
              ? cast[0].name
              : undefined;
      const field = schema.fields.find(candidate => candidate.name === column);
      if (!field) return null;
      let sql = quoteSqlIdentifier(field.name);
      const name =
        typeof selection === 'string'
          ? selection
          : (selection.as ?? (expression ? `column${index + 1}` : field.name));
      if (expression) {
        if (cast?.length !== 2 || cast[1].type !== 'Literal') return null;
        const target = getExactCast(field, cast[1].value);
        if (!target) return null;
        sql = `CAST(${sql} AS ${target.sqlType})`;
        fields.push({name, type: target.type, nullable: field.nullable});
      } else {
        fields.push({...field, name});
      }
      columns.push(`${sql} AS ${quoteSqlIdentifier(name)}`);
    }
    // DuckDB identifiers are case-insensitive, including quoted aliases.
    if (new Set(fields.map(field => field.name.toLowerCase())).size !== fields.length) return null;
    const predicate = query.where && compilePredicate(query.where, schema);
    if (query.where && !predicate) return null;
    if (!ordered && (query.offset !== undefined || query.limit !== undefined)) return null;
    const sql =
      `SELECT ${columns.join(', ')} FROM ${tableName}` +
      (predicate ? ` WHERE ${predicate}` : '') +
      order +
      (query.limit === undefined ? '' : ` LIMIT ${query.limit}`) +
      (query.offset === undefined ? '' : ` OFFSET ${query.offset}`);
    const outputSchema = {...schema, fields};
    return {
      schema: outputSchema,
      /** Executes the planned SQL when the consumer starts reading. */
      async *read(options?: {signal?: AbortSignal}) {
        yield* readStatement(sql, outputSchema, options?.signal);
      }
    };
  }

  return {
    /** Returns metadata without issuing another catalog query. */
    async getQueryMetadata() {
      return metadata;
    },
    /** Accepts only exact whole queries. */
    async planQueryPushdown(query, options) {
      options?.signal?.throwIfAborted();
      return plan(query);
    },
    /** Checks the exact CAST subset using the same compiler as whole-query execution. */
    supportsQueryProjectionPushdown(selection) {
      return Boolean(plan({select: [selection]}));
    },
    /** Executes simple reads natively when possible and applies other operators in Arrow. */
    async *read(options = {}) {
      const {columns, predicate, limit, offset, signal} = options;
      const accepted = plan({select: columns, where: predicate, limit, offset});
      if (accepted && limit !== 0) {
        yield* accepted.read({signal});
        return;
      }
      for await (const batch of executeTableScanBatches(
        async function* (readSignal) {
          for await (const batch of readStatement(
            `SELECT * FROM ${tableName}${order}`,
            schema,
            readSignal
          )) {
            yield makeTableScanBatch({
              shape: 'arrow-table',
              schema,
              data: new Table(batch.schema, [batch])
            });
          }
        },
        options,
        {
          filter: (batch, predicate, filterSignal) => {
            if (!predicate) return batch;
            const arrowBatch = batch as ArrowTableBatch;
            return makeTableScanBatch({
              ...arrowBatch,
              data: filterArrowTable(arrowBatch.data, predicate, {signal: filterSignal})
            });
          }
        }
      )) {
        const {data} = batch as ArrowTableBatch;
        yield* data.batches.length ? data.batches : [makeArrowMetadataBatch(data.schema)];
      }
    }
  };
}

/** Accepts signed integer identity and widening casts, which cannot round or overflow. */
function getExactCast(
  field: Field,
  target: unknown
): {type: Field['type']; sqlType: string} | null {
  if (target === 'float64' && ['int8', 'int16', 'int32'].includes(String(field.type))) {
    return {type: target, sqlType: 'DOUBLE'};
  }
  if (target !== 'int16' && target !== 'int32' && target !== 'int64') return null;
  const sourceType = getIntegerType(field.type);
  if (!sourceType || Number(String(field.type).slice(3)) > Number(target.slice(3))) return null;
  return {type: target, sqlType: INTEGER_TYPES[target]};
}

/** Compiles exact integer comparisons, including a single widening cast on the column. */
function compilePredicate(
  predicate: NonNullable<TableQueryPushdownRequest['where'] | TableQueryReadOptions['predicate']>,
  schema: Schema
): string | null {
  if (!('op' in predicate) || !['=', '<>', '<', '<=', '>', '>='].includes(predicate.op))
    return null;
  const [property, value] = predicate.args;
  if (!property || typeof property !== 'object' || !('property' in property)) return null;
  const field = schema.fields.find(candidate => candidate.name === property.property);
  if (!field || !getIntegerType(field.type)) return null;
  if (typeof value !== 'bigint' && (typeof value !== 'number' || !Number.isSafeInteger(value)))
    return null;
  if (value < -(2n ** 63n) || value >= 2n ** 63n) return null;
  const column = quoteSqlIdentifier(field.name);
  if (!('casts' in property)) return `${column} ${predicate.op} ${value}`;
  if (!Array.isArray(property.casts) || property.casts.length !== 1) return null;
  const cast = getExactCast(field, property.casts[0]);
  return cast ? `CAST(${column} AS ${cast.sqlType}) ${predicate.op} ${value}` : null;
}
