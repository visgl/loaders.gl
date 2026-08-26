// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {validateSQLPredicate} from './sql-predicate-schema';
import {
  isSQLPredicateParameter,
  type SQLPredicate,
  type SQLPredicateParameterValues,
  type SQLPredicateScalar,
  type SQLPredicateValue
} from './sql-predicate-types';
import type {TableQueryOptions} from './table-query';

/** SQL dialects supported by the portable table-query compiler. */
export type SQLTableQueryDialect = 'duckdb' | 'snowflake';

/** A table-bound portable query accepted by SQL-backed data sources. */
export type SQLTableQuery = TableQueryOptions &
  Readonly<{
    /** Unqualified table name. */
    tableName: string;
    /** Optional schema containing the table. */
    schemaName?: string;
    /** Optional catalog containing the schema. */
    catalogName?: string;
  }>;

/** Options controlling portable table-query compilation. */
export type SQLTableQueryCompilerOptions = Readonly<{
  /** Target SQL dialect. */
  dialect: SQLTableQueryDialect;
  /** Values used to resolve named parameter nodes retained in the predicate AST. */
  parameters?: SQLPredicateParameterValues;
}>;

/** Parameterized SQL emitted from a portable table query. */
export type CompiledSQLTableQuery = Readonly<{
  /** SQL statement containing positional placeholders. */
  sql: string;
  /** Values bound to placeholders in statement order. */
  parameters: SQLPredicateScalar[];
}>;

type SQLCompilationContext = {
  dialect: SQLTableQueryDialect;
  namedParameters?: SQLPredicateParameterValues;
  parameters: SQLPredicateScalar[];
};

/** Compiles a portable table query into parameterized DuckDB or Snowflake SQL. */
export function compileSQLTableQuery(
  query: SQLTableQuery,
  options: SQLTableQueryCompilerOptions
): CompiledSQLTableQuery {
  validateSQLTableQuery(query);
  const context: SQLCompilationContext = {
    dialect: options.dialect,
    namedParameters: options.parameters,
    parameters: []
  };
  const projection =
    query.columns === undefined ? '*' : query.columns.map(quoteSQLIdentifier).join(', ');
  const table = [query.catalogName, query.schemaName, query.tableName]
    .filter((identifier): identifier is string => identifier !== undefined)
    .map(quoteSQLIdentifier)
    .join('.');
  const clauses = [`SELECT ${projection}`, `FROM ${table}`];
  if (query.predicate) {
    clauses.push(`WHERE ${compileSQLPredicate(query.predicate, context)}`);
  }
  if (query.limit !== undefined) {
    clauses.push(`LIMIT ${query.limit}`);
  }
  return {sql: clauses.join('\n'), parameters: context.parameters};
}

/** Compiles one portable predicate node while collecting bound scalar values. */
function compileSQLPredicate(predicate: SQLPredicate, context: SQLCompilationContext): string {
  switch (predicate.op) {
    case 'and':
    case 'or':
      return `(${predicate.args
        .map(child => compileSQLPredicate(child, context))
        .join(` ${predicate.op.toUpperCase()} `)})`;
    case 'not':
      return `(NOT ${compileSQLPredicate(predicate.args[0], context)})`;
    case 'isNull':
      return `(${quoteSQLProperty(predicate.args[0])} IS NULL)`;
    case 'in':
      return `(${quoteSQLProperty(predicate.args[0])} IN (${predicate.args[1]
        .map(value => compileSQLPredicateValue(value, context))
        .join(', ')}))`;
    default:
      return `(${quoteSQLProperty(predicate.args[0])} ${predicate.op} ${compileSQLPredicateValue(
        predicate.args[1],
        context
      )})`;
  }
}

/** Adds a predicate value to the positional bindings and returns its placeholder. */
function compileSQLPredicateValue(
  value: SQLPredicateValue,
  context: SQLCompilationContext
): string {
  const scalar = isSQLPredicateParameter(value)
    ? resolveSQLPredicateParameter(value.parameter, context.namedParameters)
    : value;
  context.parameters.push(scalar);
  return getSQLPlaceholder(context.dialect, context.parameters.length);
}

/** Resolves one retained named parameter reference. */
function resolveSQLPredicateParameter(
  parameterName: string,
  parameters?: SQLPredicateParameterValues
): SQLPredicateScalar {
  if (!parameters || !Object.hasOwn(parameters, parameterName)) {
    throw new Error(`SQL predicate parameter ":${parameterName}" requires a value`);
  }
  const value = parameters[parameterName];
  validateSQLPredicate({op: '=', args: [{property: '_parameter'}, value]});
  return value;
}

/** Returns the positional placeholder used by the selected SQL API. */
function getSQLPlaceholder(_dialect: SQLTableQueryDialect, _position: number): string {
  return '?';
}

/** Quotes a possibly qualified predicate property one identifier component at a time. */
function quoteSQLProperty(property: {property: string; quoted?: boolean}): string {
  return property.quoted
    ? quoteSQLIdentifier(property.property)
    : property.property.split('.').map(quoteSQLIdentifier).join('.');
}

/** Quotes one SQL identifier using standard double-quote escaping. */
function quoteSQLIdentifier(identifier: string): string {
  validateSQLIdentifier(identifier);
  return `"${identifier.replace(/"/g, '""')}"`;
}

/** Validates the structural fields that do not require a source schema. */
function validateSQLTableQuery(query: SQLTableQuery): void {
  validateSQLIdentifier(query.tableName);
  if (query.schemaName !== undefined) validateSQLIdentifier(query.schemaName);
  if (query.catalogName !== undefined) validateSQLIdentifier(query.catalogName);
  const seenColumns = new Set<string>();
  if (query.columns?.length === 0) {
    throw new Error('SQL table-query projections must select at least one column.');
  }
  for (const column of query.columns ?? []) {
    validateSQLIdentifier(column);
    if (seenColumns.has(column)) {
      throw new Error(`Table query column was selected more than once: ${column}`);
    }
    seenColumns.add(column);
  }
  if (query.limit !== undefined && (!Number.isSafeInteger(query.limit) || query.limit < 0)) {
    throw new Error('Table query limit must be a non-negative safe integer.');
  }
  if (query.predicate) validateSQLPredicate(query.predicate);
}

/** Rejects empty or NUL-containing identifiers before quoting them. */
function validateSQLIdentifier(identifier: string): void {
  if (!identifier || identifier.includes('\0')) {
    throw new Error('SQL table-query identifiers must be non-empty and cannot contain NUL bytes.');
  }
}
