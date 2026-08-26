// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ColumnarPredicate} from './columnar-predicate';
import type {TableQueryOptions} from './table-query';
import {planTableQuery} from './table-query';

/** A scalar expression in the portable relational planner. */
export type RelationalExpression = Readonly<{
  /** Output alias for the expression. */
  name: string;
  /** Expression operator and operands. */
  expression:
    | {readonly op: 'column'; readonly column: string}
    | {readonly op: 'literal'; readonly value: boolean | number | string | null}
    | {
        readonly op: 'add' | 'subtract' | 'multiply' | 'divide';
        readonly left: string;
        readonly right: string;
      };
}>;

/** A portable ordering key. */
export type RelationalOrderKey = Readonly<{
  /** Column or expression name to order by. */
  column: string;
  /** Sort direction. */
  direction?: 'asc' | 'desc';
  /** Null placement. */
  nulls?: 'first' | 'last';
}>;

/** A portable aggregate specification. */
export type RelationalAggregate = Readonly<{
  /** Aggregate function. */
  function: 'count' | 'sum' | 'min' | 'max' | 'avg';
  /** Input column, omitted for `count(*)`. */
  column?: string;
  /** Output alias. */
  name: string;
}>;

/** A relational child query used by unions and joins. */
export type RelationalChildQuery<PredicateT extends ColumnarPredicate = ColumnarPredicate> =
  Readonly<{
    /** Logical source name. */
    source: string;
    /** Portable table query applied to the child. */
    query?: TableQueryOptions<PredicateT>;
  }>;

/** Portable relational extensions layered on top of a table scan. */
export type RelationalQueryOptions<PredicateT extends ColumnarPredicate = ColumnarPredicate> =
  TableQueryOptions<PredicateT> &
    Readonly<{
      /** Computed columns evaluated before projection. */
      expressions?: readonly RelationalExpression[];
      /** Stable ordering applied before the global limit. */
      orderBy?: readonly RelationalOrderKey[];
      /** Grouping keys for aggregate output. */
      groupBy?: readonly string[];
      /** Aggregate output definitions. */
      aggregates?: readonly RelationalAggregate[];
      /** Additional child queries to concatenate. */
      union?: readonly RelationalChildQuery<PredicateT>[];
      /** Optional equi-join child and key mapping. */
      join?: Readonly<{child: RelationalChildQuery<PredicateT>; left: string; right: string}>;
    }>;

/** Logical operator in a relational query plan. */
export type RelationalPlanStep = Readonly<{
  kind: 'table-query' | 'expression' | 'order' | 'aggregate' | 'union' | 'join';
  detail: unknown;
}>;

/** Validates and normalizes the relational extensions without executing them. */
export function planRelationalQuery<PredicateT extends ColumnarPredicate = ColumnarPredicate>(
  sourceColumnNames: readonly string[],
  options: RelationalQueryOptions<PredicateT> = {}
): {
  readonly tablePlan: ReturnType<typeof planTableQuery>;
  readonly relationalSteps: readonly RelationalPlanStep[];
} {
  const available = new Set(sourceColumnNames);
  const expressionNames = new Set<string>();
  for (const expression of options.expressions || []) {
    if (!expression.name) throw new Error('Relational expression names must be non-empty.');
    if (available.has(expression.name) || expressionNames.has(expression.name)) {
      throw new Error(`Relational expression duplicates column: ${expression.name}`);
    }
    expressionNames.add(expression.name);
  }
  const requiredColumns = new Set<string>();
  for (const expression of options.expressions || []) {
    if (expression.expression.op === 'column') requiredColumns.add(expression.expression.column);
    if ('left' in expression.expression) {
      requiredColumns.add(expression.expression.left);
      requiredColumns.add(expression.expression.right);
    }
  }
  for (const key of options.orderBy || []) requiredColumns.add(key.column);
  for (const key of options.groupBy || []) requiredColumns.add(key);
  for (const aggregate of options.aggregates || []) {
    if (aggregate.column) requiredColumns.add(aggregate.column);
  }
  const outputColumns = options.columns?.filter(column => !expressionNames.has(column));
  const tablePlan = [
    ...planTableQuery(sourceColumnNames, {
      ...options,
      columns: outputColumns,
      predicate: options.predicate
    })
  ];
  const scanStep = tablePlan[0];
  if (scanStep?.kind === 'scan') {
    const scanColumns = new Set(scanStep.columns);
    for (const column of requiredColumns) {
      if (available.has(column)) scanColumns.add(column);
    }
    tablePlan[0] = Object.freeze({kind: 'scan', columns: Object.freeze([...scanColumns])});
  }
  for (const expression of expressionNames) available.add(expression);
  for (const key of options.orderBy || []) {
    if (!available.has(key.column))
      throw new Error(`Relational order column not found: ${key.column}`);
  }
  for (const key of options.groupBy || []) {
    if (!available.has(key)) throw new Error(`Relational group column not found: ${key}`);
  }
  for (const aggregate of options.aggregates || []) {
    if (!aggregate.name) throw new Error('Relational aggregate names must be non-empty.');
    if (aggregate.column && !available.has(aggregate.column)) {
      throw new Error(`Relational aggregate column not found: ${aggregate.column}`);
    }
  }
  const relationalSteps: RelationalPlanStep[] = [];
  if (options.expressions?.length)
    relationalSteps.push({kind: 'expression', detail: options.expressions});
  if (options.orderBy?.length) relationalSteps.push({kind: 'order', detail: options.orderBy});
  if (options.aggregates?.length || options.groupBy?.length) {
    relationalSteps.push({
      kind: 'aggregate',
      detail: {groupBy: options.groupBy, aggregates: options.aggregates}
    });
  }
  if (options.union?.length) relationalSteps.push({kind: 'union', detail: options.union});
  if (options.join) relationalSteps.push({kind: 'join', detail: options.join});
  return {tablePlan, relationalSteps: Object.freeze(relationalSteps)};
}
