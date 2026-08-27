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
import type {
  RelationalAggregate,
  RelationalExpression,
  RelationalOrderKey
} from '@loaders.gl/loader-utils';

/** A named child relation using the SQL module's property-oriented predicate AST. */
type SQLChildQuery = Readonly<{
  /** Logical source name resolved by the SQL data source. */
  source: string;
  /** Optional query applied to the child relation before combining it. */
  query?: TableQueryOptions;
}>;

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
    /** Computed columns evaluated before projection. */
    expressions?: readonly RelationalExpression[];
    /** Stable ordering applied before the global limit. */
    orderBy?: readonly RelationalOrderKey[];
    /** Grouping keys for aggregate output. */
    groupBy?: readonly string[];
    /** Aggregate output definitions. */
    aggregates?: readonly RelationalAggregate[];
    /** Additional tables concatenated with `UNION ALL`. */
    union?: readonly SQLChildQuery[];
    /** Optional equi-join child table and key mapping. */
    join?: Readonly<{child: SQLChildQuery; left: string; right: string}>;
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
  return {
    sql: compileTableStatement(query, context),
    parameters: context.parameters
  };
}

/** Compiles one table statement while sharing parameter bindings with child relations. */
function compileTableStatement(query: SQLTableQuery, context: SQLCompilationContext): string {
  const projection = compileProjection(query);
  const table = [query.catalogName, query.schemaName, query.tableName]
    .filter((identifier): identifier is string => identifier !== undefined)
    .map(quoteSQLIdentifier)
    .join('.');
  const fromClause = query.join ? compileJoinFromClause(query, table, context) : `FROM ${table}`;
  const clauses = [`SELECT ${projection}`, fromClause];
  if (query.predicate) {
    clauses.push(`WHERE ${compileSQLPredicate(query.predicate, context)}`);
  }
  if (query.groupBy?.length) {
    clauses.push(`GROUP BY ${query.groupBy.map(quoteSQLIdentifier).join(', ')}`);
  }
  let sql = clauses.join('\n');
  for (const child of query.union || []) {
    const childQuery: SQLTableQuery = {
      tableName: child.source,
      ...(child.query || {})
    };
    validateSQLTableQuery(childQuery);
    sql = `${sql}\nUNION ALL\n${compileTableStatement(childQuery, context)}`;
  }
  if (query.orderBy?.length) sql += `\nORDER BY ${query.orderBy.map(compileOrderKey).join(', ')}`;
  if (query.limit !== undefined) sql += `\nLIMIT ${query.limit}`;
  return sql;
}

/** Compiles a base table and optional child relation for an equi-join. */
function compileJoinFromClause(
  query: SQLTableQuery,
  table: string,
  context: SQLCompilationContext
): string {
  const join = query.join;
  if (!join) return `FROM ${table}`;
  validateSQLIdentifier(join.child.source);
  validateSQLIdentifier(join.left);
  validateSQLIdentifier(join.right);
  const childTable = quoteSQLIdentifier(join.child.source);
  const rightRelation = join.child.query
    ? `(${compileTableStatement({tableName: join.child.source, ...join.child.query}, context)})`
    : childTable;
  return `FROM ${table} JOIN ${rightRelation} AS ${childTable} ON ${table}.${quoteSQLIdentifier(join.left)} = ${childTable}.${quoteSQLIdentifier(join.right)}`;
}

/** Compiles the SELECT list, including computed and aggregate output columns. */
function compileProjection(query: SQLTableQuery): string {
  const expressions = query.expressions || [];
  const expressionByName = new Map(expressions.map(expression => [expression.name, expression]));
  const aggregates = query.aggregates || [];
  const aggregateByName = new Map(aggregates.map(aggregate => [aggregate.name, aggregate]));
  const columns = query.columns === undefined ? undefined : [...query.columns];
  const projectionColumns =
    columns ||
    (query.groupBy?.length || query.aggregates?.length ? [...(query.groupBy || [])] : []);
  const selections = projectionColumns.map(column => {
    const expression = expressionByName.get(column);
    if (expression) {
      return `${compileRelationalExpression(expression.expression)} AS ${quoteSQLIdentifier(expression.name)}`;
    }
    const aggregate = aggregateByName.get(column);
    return aggregate
      ? `${compileAggregate(aggregate)} AS ${quoteSQLIdentifier(aggregate.name)}`
      : quoteSQLIdentifier(column);
  });
  if (!selections.length)
    return expressions.length
      ? expressions
          .map(
            expression =>
              `${compileRelationalExpression(expression.expression)} AS ${quoteSQLIdentifier(expression.name)}`
          )
          .join(', ')
      : aggregates.length
        ? aggregates
            .map(
              aggregate => `${compileAggregate(aggregate)} AS ${quoteSQLIdentifier(aggregate.name)}`
            )
            .join(', ')
        : '*';
  return selections.join(', ');
}

/** Compiles one portable scalar expression into quoted SQL. */
function compileRelationalExpression(expression: RelationalExpression['expression']): string {
  switch (expression.op) {
    case 'column':
      return quoteSQLIdentifier(expression.column);
    case 'literal':
      return expression.value === null
        ? 'NULL'
        : typeof expression.value === 'string'
          ? `'${expression.value.replace(/'/g, "''")}'`
          : String(expression.value);
    case 'add':
      return `(${quoteSQLIdentifier(expression.left)} + ${quoteSQLIdentifier(expression.right)})`;
    case 'subtract':
      return `(${quoteSQLIdentifier(expression.left)} - ${quoteSQLIdentifier(expression.right)})`;
    case 'multiply':
      return `(${quoteSQLIdentifier(expression.left)} * ${quoteSQLIdentifier(expression.right)})`;
    case 'divide':
      return `(${quoteSQLIdentifier(expression.left)} / NULLIF(${quoteSQLIdentifier(expression.right)}, 0))`;
  }
}

/** Compiles one portable aggregate function call. */
function compileAggregate(aggregate: RelationalAggregate): string {
  const column = aggregate.column ? quoteSQLIdentifier(aggregate.column) : '*';
  return `${aggregate.function.toUpperCase()}(${column})`;
}

/** Compiles one ordering key with explicit direction and null placement. */
function compileOrderKey(orderKey: RelationalOrderKey): string {
  const direction = orderKey.direction?.toUpperCase() || 'ASC';
  const nulls = orderKey.nulls ? ` NULLS ${orderKey.nulls.toUpperCase()}` : '';
  return `${quoteSQLIdentifier(orderKey.column)} ${direction}${nulls}`;
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
  validateRelationalQuery(query);
}

/** Validates relational identifiers and enum values before SQL generation. */
function validateRelationalQuery(query: SQLTableQuery): void {
  const expressionNames = new Set<string>();
  for (const expression of query.expressions || []) {
    validateSQLIdentifier(expression.name);
    if (expressionNames.has(expression.name))
      throw new Error(`Relational expression duplicates column: ${expression.name}`);
    expressionNames.add(expression.name);
    const definition = expression.expression;
    if (definition.op === 'column') validateSQLIdentifier(definition.column);
    if ('left' in definition) {
      validateSQLIdentifier(definition.left);
      validateSQLIdentifier(definition.right);
    }
  }
  for (const column of query.groupBy || []) validateSQLIdentifier(column);
  for (const key of query.orderBy || []) {
    validateSQLIdentifier(key.column);
    if (key.direction && key.direction !== 'asc' && key.direction !== 'desc')
      throw new Error(`Invalid order direction: ${key.direction}`);
    if (key.nulls && key.nulls !== 'first' && key.nulls !== 'last')
      throw new Error(`Invalid null placement: ${key.nulls}`);
  }
  for (const aggregate of query.aggregates || []) {
    validateSQLIdentifier(aggregate.name);
    if (aggregate.function !== 'count' && !aggregate.column)
      throw new Error(`Relational aggregate ${aggregate.function} requires a column.`);
    if (aggregate.column) validateSQLIdentifier(aggregate.column);
  }
}

/** Rejects empty or NUL-containing identifiers before quoting them. */
function validateSQLIdentifier(identifier: string): void {
  if (!identifier || identifier.includes('\0')) {
    throw new Error('SQL table-query identifiers must be non-empty and cannot contain NUL bytes.');
  }
}
