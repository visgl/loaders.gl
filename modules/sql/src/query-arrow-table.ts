// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {ArrowTable} from '@loaders.gl/schema';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';
import {convertRowsToArrowTable} from './sql-utils';

import {
  isSQLPredicateParameter,
  type SQLComparisonPredicate,
  type SQLInPredicate,
  type SQLLogicalPredicate,
  type SQLNotPredicate,
  type SQLNullPredicate,
  type SQLPredicate,
  type SQLPredicateValue
} from './sql-predicate-types';
import {
  getSQLPredicateColumnNames,
  explainTableQuery,
  planTableQuery,
  type TableQueryFilterStep,
  type TableQueryLimitStep,
  type TableQueryOptions,
  type TableQueryPlanStep,
  type TableQueryProjectStep,
  type TableQueryScanStep
} from './table-query';
import type {
  RelationalAggregate,
  RelationalExpression,
  RelationalOrderKey
} from '@loaders.gl/loader-utils';
import {planRelationalQuery} from '@loaders.gl/loader-utils';
export {ARROW_TABLE_QUERY_CAPABILITIES} from './table-query-capabilities';

/** Options for the lightweight in-memory Arrow query executor. */
export type ArrowQueryOptions = TableQueryOptions &
  Readonly<{
    /** Cancels the query before or during predicate evaluation. */
    signal?: AbortSignal;
    /** Computed columns evaluated before ordering and projection. */
    expressions?: readonly RelationalExpression[];
    /** Stable ordering applied before the global limit. */
    orderBy?: readonly RelationalOrderKey[];
    /** Grouping keys and aggregate definitions for relational output. */
    groupBy?: readonly string[];
    /** Aggregate definitions evaluated after filtering and expressions. */
    aggregates?: readonly RelationalAggregate[];
  }>;

/** Explains an Arrow table query without materializing or scanning table rows. */
export function explainArrowTableQuery(sourceTable: ArrowTable, options: ArrowQueryOptions = {}) {
  return explainTableQuery(
    sourceTable.data.schema.fields.map(field => field.name),
    options
  );
}

type SQLTruthValue = boolean | null;

/**
 * Executes a small, Arrow-native query over one in-memory table.
 *
 * The proof of concept supports portable predicates, column projection, and limits. Projection
 * and limits without a predicate preserve Arrow's zero-copy views. Predicate evaluation is
 * currently row-oriented and materializes the matching result rows; later physical operators can
 * replace this implementation with vectorized selection handling without changing this API.
 */
export function queryArrowTable(
  sourceTable: ArrowTable,
  options: ArrowQueryOptions = {}
): ArrowTable {
  throwIfAborted(options.signal);

  if (hasRelationalOperators(options)) {
    return queryArrowTableRelational(sourceTable, options);
  }

  const sourceData = sourceTable.data;
  const plan = planTableQuery(
    sourceData.schema.fields.map(field => field.name),
    options
  );
  const scannedData = sourceData.select([...getScanStep(plan).columns]);
  const projectedData = scannedData.select([...getProjectStep(plan).columns]);
  const predicate = getFilterStep(plan)?.predicate;
  const limit = getLimitStep(plan)?.limit ?? Number.POSITIVE_INFINITY;
  if (!predicate) {
    return wrapArrowTable(projectedData.slice(0, limit));
  }

  const predicateColumns = getPredicateColumns(scannedData, getSQLPredicateColumnNames(predicate));
  const matchingRowIndices: number[] = [];
  for (
    let rowIndex = 0;
    rowIndex < scannedData.numRows && matchingRowIndices.length < limit;
    rowIndex++
  ) {
    throwIfAborted(options.signal);
    if (evaluatePredicate(predicate, predicateColumns, rowIndex) === true) {
      matchingRowIndices.push(rowIndex);
    }
  }

  if (matchingRowIndices.length === 0) {
    return wrapArrowTable(projectedData.slice(0, 0));
  }

  const outputColumns: Record<string, arrow.Vector> = {};
  for (const field of projectedData.schema.fields) {
    const sourceColumn = projectedData.getChild(field.name);
    if (!sourceColumn) {
      throw new Error(`Arrow query could not read column "${field.name}".`);
    }
    const values = matchingRowIndices.map(rowIndex => sourceColumn.get(rowIndex));
    outputColumns[field.name] = arrow.vectorFromArray(values, sourceColumn.type);
  }
  return wrapArrowTable(new arrow.Table(projectedData.schema, outputColumns));
}

/** Executes the relational subset that can be evaluated against one in-memory Arrow table. */
function queryArrowTableRelational(
  sourceTable: ArrowTable,
  options: ArrowQueryOptions
): ArrowTable {
  const sourceData = sourceTable.data;
  const sourceColumnNames = sourceData.schema.fields.map(field => field.name);
  const relationalPlan = planRelationalQuery(sourceColumnNames, options);
  const scanStep = relationalPlan.tablePlan.find(step => step.kind === 'scan');
  if (!scanStep || scanStep.kind !== 'scan') {
    throw new Error('Arrow relational query plan is missing a scan step.');
  }
  const scannedTable = wrapArrowTable(sourceData.select([...scanStep.columns]));
  const filteredTable = queryArrowTable(scannedTable, {
    predicate: options.predicate,
    columns: scanStep.columns,
    signal: options.signal
  });
  let rows = arrowTableToRows(filteredTable.data);

  for (const expression of options.expressions || []) {
    for (const row of rows) {
      row[expression.name] = evaluateRelationalExpression(expression, row);
    }
  }

  if (options.groupBy?.length || options.aggregates?.length) {
    rows = aggregateRows(rows, options.groupBy || [], options.aggregates || []);
  }

  if (options.orderBy?.length) {
    const orderBy = options.orderBy;
    rows = rows
      .map((row, index) => ({row, index}))
      .sort((left, right) => compareRows(left.row, right.row, orderBy) || left.index - right.index)
      .map(entry => entry.row);
  }

  const outputColumns =
    options.columns ||
    (options.groupBy?.length || options.aggregates?.length
      ? [...(options.groupBy || []), ...(options.aggregates || []).map(aggregate => aggregate.name)]
      : sourceColumnNames);
  const outputRows = rows.map(row => {
    const output: Record<string, unknown> = {};
    for (const columnName of outputColumns) {
      if (!(columnName in row)) {
        throw new Error(`Arrow relational query column not found: ${columnName}`);
      }
      output[columnName] = row[columnName];
    }
    return output;
  });
  const limit = options.limit === undefined ? outputRows.length : options.limit;
  const limitedRows = outputRows.slice(0, limit);
  return limitedRows.length
    ? convertRowsToArrowTable(limitedRows)
    : createEmptyRelationalResult(sourceData, outputColumns, options);
}

/** Returns whether the query uses any in-memory relational operator. */
function hasRelationalOperators(options: ArrowQueryOptions): boolean {
  return Boolean(
    options.expressions?.length ||
      options.orderBy?.length ||
      options.groupBy?.length ||
      options.aggregates?.length
  );
}

/** Materializes one Arrow table into row objects for the relational proof of concept. */
function arrowTableToRows(data: arrow.Table): Record<string, unknown>[] {
  const columns = data.schema.fields.map(field => ({
    name: field.name,
    vector: data.getChild(field.name)
  }));
  return Array.from({length: data.numRows}, (_, rowIndex) => {
    const row: Record<string, unknown> = {};
    for (const column of columns) {
      if (!column.vector) throw new Error(`Arrow relational query could not read ${column.name}`);
      row[column.name] = column.vector.get(rowIndex);
    }
    return row;
  });
}

/** Evaluates one portable scalar expression with SQL-style null propagation. */
function evaluateRelationalExpression(
  expression: RelationalExpression,
  row: Readonly<Record<string, unknown>>
): unknown {
  const definition = expression.expression;
  if (definition.op === 'literal') return definition.value;
  if (definition.op === 'column') return row[definition.column];
  const left = row[definition.left];
  const right = row[definition.right];
  if (left === null || left === undefined || right === null || right === undefined) return null;
  if (typeof left !== 'number' || typeof right !== 'number') {
    throw new Error(`Arrow relational expression ${expression.name} requires numeric operands.`);
  }
  switch (definition.op) {
    case 'add':
      return left + right;
    case 'subtract':
      return left - right;
    case 'multiply':
      return left * right;
    case 'divide':
      return right === 0 ? null : left / right;
  }
}

/** Compares two rows using stable, multi-key relational ordering. */
function compareRows(
  left: Readonly<Record<string, unknown>>,
  right: Readonly<Record<string, unknown>>,
  orderBy: readonly RelationalOrderKey[]
): number {
  for (const key of orderBy) {
    const leftValue = left[key.column];
    const rightValue = right[key.column];
    const nulls = key.nulls || 'last';
    if (
      leftValue === null ||
      leftValue === undefined ||
      rightValue === null ||
      rightValue === undefined
    ) {
      if (leftValue === rightValue) continue;
      const nullResult = leftValue === null || leftValue === undefined ? -1 : 1;
      return nulls === 'first' ? nullResult : -nullResult;
    }
    const result = compareSortValues(leftValue, rightValue);
    if (result) return (key.direction === 'desc' ? -1 : 1) * result;
  }
  return 0;
}

/** Compares two non-null values supported by portable ordering. */
function compareSortValues(left: unknown, right: unknown): number {
  if (left instanceof Date && right instanceof Date)
    return compareNumbers(left.getTime(), right.getTime());
  if (typeof left === 'bigint' && typeof right === 'bigint')
    return left === right ? 0 : left < right ? -1 : 1;
  if (typeof left === 'number' && typeof right === 'number') return compareNumbers(left, right);
  if (typeof left === 'string' && typeof right === 'string')
    return left === right ? 0 : left < right ? -1 : 1;
  if (typeof left === 'boolean' && typeof right === 'boolean') return Number(left) - Number(right);
  throw new Error(
    `Arrow relational order cannot compare ${getValueType(left)} with ${getValueType(right)}.`
  );
}

/** Groups rows and computes the requested aggregate output columns. */
function aggregateRows(
  rows: readonly Record<string, unknown>[],
  groupBy: readonly string[],
  aggregates: readonly RelationalAggregate[]
): Record<string, unknown>[] {
  const groups = new Map<string, Record<string, unknown>[]>();
  for (const row of rows) {
    const key = serializeGroupKey(groupBy.map(column => row[column]));
    const group = groups.get(key) || [];
    group.push(row);
    groups.set(key, group);
  }
  if (!groupBy.length && !rows.length) groups.set('[]', []);
  return [...groups.values()].map(group => {
    const output: Record<string, unknown> = {};
    for (const column of groupBy) output[column] = group[0]?.[column] ?? null;
    for (const aggregate of aggregates)
      output[aggregate.name] = evaluateAggregate(aggregate, group);
    return output;
  });
}

/** Produces a collision-resistant group key for Arrow scalar values, including bigint values. */
function serializeGroupKey(values: readonly unknown[]): string {
  return values
    .map(value => {
      if (value === null || value === undefined) return 'null:';
      if (value instanceof Date) return `date:${value.getTime()}`;
      if (value instanceof Uint8Array) return `bytes:${Array.from(value).join('.')}`;
      return `${typeof value}:${String(value)}`;
    })
    .join('\u001f');
}

/** Creates a zero-row Arrow result while preserving source and computed output fields. */
function createEmptyRelationalResult(
  sourceData: arrow.Table,
  outputColumns: readonly string[],
  options: ArrowQueryOptions
): ArrowTable {
  const sourceFields = new Map(sourceData.schema.fields.map(field => [field.name, field]));
  const expressions = new Map(
    (options.expressions || []).map(expression => [expression.name, expression])
  );
  const aggregates = new Map(
    (options.aggregates || []).map(aggregate => [aggregate.name, aggregate])
  );
  const fields = outputColumns.map(columnName => {
    const sourceField = sourceFields.get(columnName);
    if (sourceField) return sourceField;
    const expression = expressions.get(columnName);
    if (expression)
      return new arrow.Field(columnName, getExpressionType(expression, sourceFields), true);
    const aggregate = aggregates.get(columnName);
    if (aggregate)
      return new arrow.Field(columnName, getAggregateType(aggregate, sourceFields), true);
    return new arrow.Field(columnName, new arrow.Utf8(), true);
  });
  const columns: Record<string, arrow.Vector> = {};
  for (const field of fields) columns[field.name] = arrow.vectorFromArray([], field.type);
  return wrapArrowTable(new arrow.Table(new arrow.Schema(fields), columns));
}

/** Infers the Arrow type for an expression in an empty relational result. */
function getExpressionType(
  expression: RelationalExpression,
  sourceFields: ReadonlyMap<string, arrow.Field>
): arrow.DataType {
  if (expression.expression.op === 'literal') {
    const value = expression.expression.value;
    if (typeof value === 'boolean') return new arrow.Bool();
    if (typeof value === 'number') return new arrow.Float64();
    return new arrow.Utf8();
  }
  if (expression.expression.op === 'column') {
    return sourceFields.get(expression.expression.column)?.type || new arrow.Utf8();
  }
  return new arrow.Float64();
}

/** Infers the Arrow type for an aggregate in an empty relational result. */
function getAggregateType(
  aggregate: RelationalAggregate,
  sourceFields: ReadonlyMap<string, arrow.Field>
): arrow.DataType {
  if (aggregate.function === 'count') return new arrow.Int32();
  return aggregate.column
    ? sourceFields.get(aggregate.column)?.type || new arrow.Float64()
    : new arrow.Float64();
}

/** Computes one aggregate over a group while ignoring null input values. */
function evaluateAggregate(
  aggregate: RelationalAggregate,
  rows: readonly Record<string, unknown>[]
): unknown {
  if (aggregate.function === 'count')
    return aggregate.column
      ? rows.filter(row => row[aggregate.column!] != null).length
      : rows.length;
  const values = rows.map(row => row[aggregate.column!]).filter(value => value != null);
  if (!values.length) return null;
  if (!values.every(value => typeof value === 'number'))
    throw new Error(`Arrow aggregate ${aggregate.function} requires numeric values.`);
  const numericValues = values as number[];
  switch (aggregate.function) {
    case 'sum':
      return numericValues.reduce((sum, value) => sum + value, 0);
    case 'avg':
      return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
    case 'min':
      return Math.min(...numericValues);
    case 'max':
      return Math.max(...numericValues);
  }
}

/** Creates a predicate-column lookup so values are not resolved for every source row. */
function getPredicateColumns(
  sourceTable: arrow.Table,
  columnNames: readonly string[]
): Readonly<Record<string, arrow.Vector>> {
  const columns: Record<string, arrow.Vector> = {};
  for (const columnName of columnNames) {
    const column = sourceTable.getChild(columnName);
    if (!column) {
      throw new Error(`Arrow query column not found: ${columnName}`);
    }
    columns[columnName] = column;
  }
  return columns;
}

/** Evaluates a predicate against one Arrow table row using SQL three-valued Boolean logic. */
function evaluatePredicate(
  predicate: SQLPredicate,
  columns: Readonly<Record<string, arrow.Vector>>,
  rowIndex: number
): SQLTruthValue {
  if (isLogicalPredicate(predicate)) {
    const values = predicate.args.map(child => evaluatePredicate(child, columns, rowIndex));
    return predicate.op === 'and' ? evaluateAnd(values) : evaluateOr(values);
  }
  if (isNotPredicate(predicate)) {
    const value = evaluatePredicate(predicate.args[0], columns, rowIndex);
    return value === null ? null : !value;
  }

  const value = getColumnValue(columns, predicate.args[0].property, rowIndex);
  if (isNullPredicate(predicate)) {
    return value === null;
  }
  if (isInPredicate(predicate)) {
    return evaluateIn(value, predicate.args[1]);
  }
  return evaluateComparison(value, predicate);
}

/** Returns the value of one predicate column or raises an internal invariant error. */
function getColumnValue(
  columns: Readonly<Record<string, arrow.Vector>>,
  columnName: string,
  rowIndex: number
): unknown {
  const column = columns[columnName];
  if (!column) {
    throw new Error(`Arrow query could not read predicate column "${columnName}".`);
  }
  return column.get(rowIndex);
}

/** Evaluates SQL AND with null propagation. */
function evaluateAnd(values: readonly SQLTruthValue[]): SQLTruthValue {
  if (values.includes(false)) {
    return false;
  }
  return values.includes(null) ? null : true;
}

/** Evaluates SQL OR with null propagation. */
function evaluateOr(values: readonly SQLTruthValue[]): SQLTruthValue {
  if (values.includes(true)) {
    return true;
  }
  return values.includes(null) ? null : false;
}

/** Evaluates a membership expression with SQL null propagation. */
function evaluateIn(value: unknown, candidates: readonly SQLPredicateValue[]): SQLTruthValue {
  if (value === null || value === undefined) {
    return null;
  }
  for (const candidate of candidates) {
    if (compareValues(value, candidate) === 0) {
      return true;
    }
  }
  return false;
}

/** Evaluates a binary SQL comparison with SQL null propagation. */
function evaluateComparison(value: unknown, predicate: SQLComparisonPredicate): SQLTruthValue {
  if (value === null || value === undefined) {
    return null;
  }
  const comparison = compareValues(value, predicate.args[1]);
  switch (predicate.op) {
    case '=':
      return comparison === 0;
    case '<>':
      return comparison !== 0;
    case '<':
      return comparison < 0;
    case '<=':
      return comparison <= 0;
    case '>':
      return comparison > 0;
    case '>=':
      return comparison >= 0;
  }
}

/** Compares supported predicate values and rejects comparisons without an unambiguous ordering. */
function compareValues(left: unknown, right: SQLPredicateValue): number {
  if (isSQLPredicateParameter(right)) {
    throw new Error(
      `Arrow query parameter ":${right.parameter}" must be bound before query execution.`
    );
  }
  if (left instanceof Date && right instanceof Date) {
    return compareNumbers(left.getTime(), right.getTime());
  }
  if (left instanceof Uint8Array && right instanceof Uint8Array) {
    return compareBinary(left, right);
  }
  if (typeof left === 'bigint' && typeof right === 'bigint') {
    return left === right ? 0 : left < right ? -1 : 1;
  }
  if (typeof left === 'bigint' && typeof right === 'number' && Number.isSafeInteger(right)) {
    return compareValues(left, BigInt(right));
  }
  if (typeof left === 'number' && typeof right === 'bigint' && Number.isSafeInteger(left)) {
    return compareValues(BigInt(left), right);
  }
  if (typeof left === 'number' && typeof right === 'number') {
    return compareNumbers(left, right);
  }
  if (typeof left === 'string' && typeof right === 'string') {
    return left === right ? 0 : left < right ? -1 : 1;
  }
  if (typeof left === 'boolean' && typeof right === 'boolean') {
    return Number(left) - Number(right);
  }
  throw new Error(
    `Arrow query cannot compare ${getValueType(left)} with ${getValueType(right)} values.`
  );
}

/** Compares two finite number values. */
function compareNumbers(left: number, right: number): number {
  if (!Number.isFinite(left) || !Number.isFinite(right)) {
    throw new Error('Arrow query cannot compare non-finite numbers.');
  }
  return left === right ? 0 : left < right ? -1 : 1;
}

/** Compares binary values lexicographically. */
function compareBinary(left: Uint8Array, right: Uint8Array): number {
  const commonLength = Math.min(left.length, right.length);
  for (let index = 0; index < commonLength; index++) {
    if (left[index] !== right[index]) {
      return left[index] < right[index] ? -1 : 1;
    }
  }
  return left.length === right.length ? 0 : left.length < right.length ? -1 : 1;
}

/** Returns a human-readable type name for predicate diagnostics. */
function getValueType(value: unknown): string {
  if (value instanceof Date) {
    return 'Date';
  }
  if (value instanceof Uint8Array) {
    return 'Uint8Array';
  }
  return typeof value;
}

/** Returns whether the predicate combines two or more child predicates. */
function isLogicalPredicate(predicate: SQLPredicate): predicate is SQLLogicalPredicate {
  return predicate.op === 'and' || predicate.op === 'or';
}

/** Returns whether the predicate negates one child predicate. */
function isNotPredicate(predicate: SQLPredicate): predicate is SQLNotPredicate {
  return predicate.op === 'not';
}

/** Returns whether the predicate tests a column for null values. */
function isNullPredicate(predicate: SQLPredicate): predicate is SQLNullPredicate {
  return predicate.op === 'isNull';
}

/** Returns whether the predicate tests a column against several values. */
function isInPredicate(predicate: SQLPredicate): predicate is SQLInPredicate {
  return predicate.op === 'in';
}

/** Returns the mandatory source scan from a normalized table-query plan. */
function getScanStep(plan: readonly TableQueryPlanStep[]): TableQueryScanStep {
  const step = plan.find((candidate): candidate is TableQueryScanStep => candidate.kind === 'scan');
  if (!step) {
    throw new Error('Arrow query plan is missing a scan step.');
  }
  return step;
}

/** Returns the optional predicate filter from a normalized table-query plan. */
function getFilterStep(plan: readonly TableQueryPlanStep[]): TableQueryFilterStep | undefined {
  return plan.find((candidate): candidate is TableQueryFilterStep => candidate.kind === 'filter');
}

/** Returns the mandatory output projection from a normalized table-query plan. */
function getProjectStep(plan: readonly TableQueryPlanStep[]): TableQueryProjectStep {
  const step = plan.find(
    (candidate): candidate is TableQueryProjectStep => candidate.kind === 'project'
  );
  if (!step) {
    throw new Error('Arrow query plan is missing a project step.');
  }
  return step;
}

/** Returns the optional result limit from a normalized table-query plan. */
function getLimitStep(plan: readonly TableQueryPlanStep[]): TableQueryLimitStep | undefined {
  return plan.find((candidate): candidate is TableQueryLimitStep => candidate.kind === 'limit');
}

/** Throws a standard cancellation error if a caller has aborted the query. */
function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    const error = new Error('Arrow query was aborted.');
    error.name = 'AbortError';
    throw error;
  }
}

/** Wraps an Arrow table with the loaders.gl Arrow-table shape and converted schema. */
function wrapArrowTable(data: arrow.Table): ArrowTable {
  return {
    shape: 'arrow-table',
    schema: convertArrowToSchema(data.schema),
    data
  };
}
