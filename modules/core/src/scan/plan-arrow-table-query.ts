// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {ArrowBatchQuery, ArrowTableQuery} from '@math.gl/sql/query';
import {filterArrowTable, projectArrowTable} from './arrow-execution';
import type {SQLPredicate} from './sql-predicate-types';
import type {TableSelection} from '@loaders.gl/core/loader-utils';

import {planTableQuery, type TableQueryOptions} from './table-query';
import type {
  RelationalAggregate,
  RelationalExpression,
  RelationalOrderKey
} from '@loaders.gl/core/loader-utils';
import {
  explainTableQuery as explainColumnarTableQuery,
  planRelationalQuery
} from '@loaders.gl/core/loader-utils';
import {ARROW_TABLE_QUERY_CAPABILITIES} from './table-query-capabilities';
import {validateSQLPredicate} from './sql-predicate-schema';
export {ARROW_TABLE_QUERY_CAPABILITIES};

/** A named child relation using the SQL module's property-oriented predicate AST. */
type ArrowChildQuery = Readonly<{
  /** Logical source name resolved through the query's table map. */
  source: string;
  /** Optional query applied to the child relation before combining it. */
  query?: TableQueryOptions;
}>;

/** Options for the lightweight in-memory Arrow query executor. */
export type ArrowQueryOptions = TableQueryOptions &
  Readonly<{
    /** Output source fields and aliases, in selection order. Cannot be combined with columns. */
    select?: readonly TableSelection[];
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
    /** Additional Arrow tables concatenated in source order before relational operators. */
    union?: readonly ArrowChildQuery[];
    /** Optional equi-join against a table supplied in `tables`. */
    join?: Readonly<{child: ArrowChildQuery; left: string; right: string}>;
    /** Named in-memory child tables used by union and join operators. */
    tables?: Readonly<Record<string, arrow.Table>>;
  }>;

/** Explains an Arrow table query without materializing or scanning table rows. */
export function explainArrowTableQuery(
  sourceTable: arrow.Table,
  options: ArrowQueryOptions = {}
): import('./table-query').TableQueryExplain {
  if (options.select !== undefined) {
    if (options.columns !== undefined || hasRelationalOperators(options) || options.join) {
      throw new Error('Arrow select cannot be combined with columns or relational operators.');
    }
    const projected = projectArrowTable(sourceTable, options.select);
    const columns = [
      ...new Set(
        options.select.map(selection =>
          typeof selection === 'string' ? selection : selection.column
        )
      )
    ];
    const {select, ...remainingOptions} = options;
    const explanation = explainArrowTableQuery(sourceTable, {...remainingOptions, columns});
    const outputColumns = Object.freeze(projected.schema.fields.map(field => field.name));
    return Object.freeze({
      ...explanation,
      outputColumns,
      plan: Object.freeze(
        explanation.plan.map(step =>
          step.kind === 'project' ? Object.freeze({...step, columns: outputColumns, select}) : step
        )
      )
    });
  }
  if (options.predicate) {
    validateSQLPredicate(options.predicate);
  }
  return explainColumnarTableQuery(
    sourceTable.schema.fields.map(field => field.name),
    options,
    ARROW_TABLE_QUERY_CAPABILITIES
  );
}

/** Executes a validated linear query after portable predicates have been applied. */
type ExecuteLinearArrowQuery = (
  table: arrow.Table,
  options: Readonly<{
    select?: readonly string[];
    where?: SQLPredicate;
    limit?: number;
    signal?: AbortSignal;
  }>
) => arrow.Table;

/** Projects and limits Arrow rows for the lightweight scan sources. */
const executePortableArrowQuery: ExecuteLinearArrowQuery = (
  table,
  {select, where, limit, signal}
) => {
  if (where) table = filterArrowTable(table, where, {limit, signal});
  const projected = select ? projectArrowTable(table, select) : table;
  return projected.numRows === 0 || limit === undefined ? projected : projected.slice(0, limit);
};

/**
 * Executes a small, Arrow-native query over one in-memory table.
 *
 * Linear queries delegate to math.gl. Named source combinations retain loaders.gl planning.
 */
export function queryArrowTable(
  sourceTable: arrow.Table,
  options: ArrowQueryOptions = {},
  executeLinear: ExecuteLinearArrowQuery = executePortableArrowQuery,
  executeRelational?: (table: arrow.Table, query: ArrowTableQuery) => arrow.Table
): arrow.Table {
  throwIfAborted(options.signal);
  if (options.select !== undefined) {
    if (options.columns !== undefined || hasRelationalOperators(options) || options.join) {
      throw new Error('Arrow select cannot be combined with columns or relational operators.');
    }
    // Validate aliases before evaluating any predicate, then apply them after filtering.
    projectArrowTable(sourceTable, options.select);
    const columns = [
      ...new Set(
        options.select.map(selection =>
          typeof selection === 'string' ? selection : selection.column
        )
      )
    ];
    const {select, ...remainingOptions} = options;
    const result = queryArrowTable(sourceTable, {...remainingOptions, columns}, executeLinear);
    return projectArrowTable(result, select);
  }

  if (options.join) {
    validateArrowJoinQuery(sourceTable, options);
  }

  if (options.join && hasRelationalOperators(options)) {
    throw new Error('Arrow joins cannot yet be combined with other relational operators.');
  }
  if (options.join) {
    if (!executeRelational) throw new Error('Arrow joins require the SQL executor.');
    return queryArrowJoin(sourceTable, options, executeRelational);
  }

  if (hasRelationalOperators(options)) {
    if (!executeRelational) throw new Error('Arrow relational queries require the SQL executor.');
    return queryArrowTableRelational(sourceTable, options, executeRelational);
  }

  const plan = planTableQuery(
    sourceTable.schema.fields.map(field => field.name),
    options
  );
  const projection = plan.find(step => step.kind === 'project');
  return executeLinear(sourceTable, {
    where: options.predicate,
    select: projection?.columns,
    limit: options.limit,
    signal: options.signal
  });
}

/** Resolves named inputs and delegates relational execution to math.gl. */
function queryArrowTableRelational(
  sourceTable: arrow.Table,
  options: ArrowQueryOptions,
  execute: (table: arrow.Table, query: ArrowTableQuery) => arrow.Table
): arrow.Table {
  const sourceColumns = sourceTable.schema.fields.map(field => field.name);
  const grouped = options.groupBy?.length || options.aggregates?.length;
  const outputColumns =
    options.columns ??
    (grouped
      ? [...(options.groupBy ?? []), ...(options.aggregates ?? []).map(aggregate => aggregate.name)]
      : sourceColumns);
  const plan = planRelationalQuery(sourceColumns, {...options, columns: outputColumns} as never);
  const scan = plan.tablePlan.find(step => step.kind === 'scan')!;
  let table = execute(sourceTable, {
    where: options.predicate,
    select: scan.columns,
    signal: options.signal
  });
  if (options.union?.length) {
    const childPlan = planRelationalQuery(sourceColumns, {
      ...options,
      columns: outputColumns,
      predicate: undefined
    } as never);
    const columns = childPlan.tablePlan.find(step => step.kind === 'scan')!.columns;
    const union = options.union.map(child => {
      const input = options.tables?.[child.source];
      if (!input) throw new Error('Arrow union source not found: ' + child.source);
      return queryArrowTable(input, {...child.query, columns, signal: options.signal});
    });
    table = execute(projectArrowTable(table, columns), {union, signal: options.signal});
  }
  for (const {name, expression} of options.expressions ?? []) {
    const select: ArrowBatchQuery['select'] = [
      ...table.schema.fields.map(field => field.name),
      expression.op === 'column'
        ? {column: expression.column, as: name}
        : {expression: toArrowExpression(expression), as: name}
    ];
    table = execute(table, {select, signal: options.signal});
  }
  return execute(table, {
    select: outputColumns,
    groupBy: options.groupBy,
    aggregates: Object.fromEntries(
      (options.aggregates ?? []).map(aggregate => {
        const expression =
          aggregate.column === undefined ? undefined : identifier(aggregate.column);
        if (aggregate.function === 'count')
          return [aggregate.name, {operation: 'COUNT', expression}];
        const operations = {sum: 'SUM', min: 'MIN', max: 'MAX', avg: 'AVG'} as const;
        return [
          aggregate.name,
          {operation: operations[aggregate.function], expression: expression!}
        ];
      })
    ),
    orderBy: options.orderBy,
    limit: options.limit,
    signal: options.signal
  });
}

/** References an Arrow field by name without parsing SQL. */
function identifier(name: string): {type: 'Identifier'; name: string} {
  return {type: 'Identifier', name};
}

/** Translates portable arithmetic to the upstream expression AST. */
function toArrowExpression(
  expression: Exclude<RelationalExpression['expression'], {op: 'column'}>
) {
  if (expression.op === 'literal') return literal(expression.value);
  const operators = {add: '+', subtract: '-', multiply: '*', divide: '/'} as const;
  return {
    type: 'BinaryExpression' as const,
    operator: operators[expression.op],
    left: identifier(expression.left),
    right: identifier(expression.right)
  };
}

/** Creates a scalar AST literal for the Arrow compiler. */
function literal(value: boolean | number | string | null) {
  return {type: 'Literal' as const, value};
}

/** Returns whether the query uses any in-memory relational operator. */
function hasRelationalOperators(options: ArrowQueryOptions): boolean {
  return Boolean(
    options.expressions?.length ||
      options.orderBy?.length ||
      options.groupBy?.length ||
      options.aggregates?.length ||
      options.union?.length
  );
}

/** Resolves child inputs and delegates the residual equijoin to math.gl. */
function queryArrowJoin(
  sourceTable: arrow.Table,
  options: ArrowQueryOptions,
  executeRelational: (table: arrow.Table, query: ArrowTableQuery) => arrow.Table
): arrow.Table {
  const join = options.join;
  if (!join) throw new Error('Arrow join query is missing a join definition.');
  const childTable = options.tables?.[join.child.source];
  if (!childTable) throw new Error(`Arrow join source not found: ${join.child.source}`);
  const left = queryArrowTable(sourceTable, {
    predicate: options.predicate,
    signal: options.signal
  });
  const right = queryArrowTable(childTable, {
    ...join.child.query,
    signal: options.signal
  });
  return executeRelational(left, {
    join: {table: right, left: join.left, right: join.right, rightPrefix: `${join.child.source}.`},
    select: options.columns,
    limit: options.limit,
    signal: options.signal
  });
}

/** Validates root and child projections before dispatching to the join executor. */
function validateArrowJoinQuery(sourceTable: arrow.Table, options: ArrowQueryOptions): void {
  const join = options.join;
  if (!join) return;
  const sourceColumnNames = sourceTable.schema.fields.map(field => field.name);
  const childTable = options.tables?.[join.child.source];
  if (!childTable) throw new Error(`Arrow join source not found: ${join.child.source}`);
  const childColumnNames = childTable.schema.fields.map(field => field.name);
  if (!sourceColumnNames.includes(join.left)) {
    throw new Error(`Arrow join column not found: ${join.left}`);
  }
  if (!childColumnNames.includes(join.right)) {
    throw new Error(`Arrow join column not found: ${join.right}`);
  }

  const childPrefix = `${join.child.source}.`;
  const rootColumns = options.columns?.filter(column => !column.startsWith(childPrefix));
  planTableQuery(sourceColumnNames, {
    predicate: options.predicate,
    columns: rootColumns?.length ? rootColumns : undefined,
    limit: options.limit,
    signal: options.signal
  });

  const childQuery = join.child.query || {};
  planTableQuery(childColumnNames, childQuery);
  const childOutputColumns = childQuery.columns || childColumnNames;
  if (!childOutputColumns.includes(join.right)) {
    throw new Error(`Arrow join child projection must include: ${join.right}`);
  }
  const projectedChildColumns =
    options.columns?.filter(column => column.startsWith(childPrefix)) || [];
  const seenChildColumns = new Set<string>();
  for (const projectedColumn of projectedChildColumns) {
    const childColumn = projectedColumn.slice(childPrefix.length);
    if (!childColumnNames.includes(childColumn)) {
      throw new Error(`Arrow join column not found: ${projectedColumn}`);
    }
    if (seenChildColumns.has(childColumn)) {
      throw new Error(`Arrow query column was selected more than once: ${projectedColumn}`);
    }
    seenChildColumns.add(childColumn);
    if (!childOutputColumns.includes(childColumn)) {
      throw new Error(`Arrow join child projection does not include: ${childColumn}`);
    }
  }
}

/** Throws a standard cancellation error if a caller has aborted the query. */
function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    const error = new Error('Arrow query was aborted.');
    error.name = 'AbortError';
    throw error;
  }
}
