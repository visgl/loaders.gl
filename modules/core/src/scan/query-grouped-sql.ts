// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parseSQLSelectStatement} from '@math.gl/sql/parser';
import type {Table} from 'apache-arrow';
import {queryProgressive, type QueryOptions} from './query';
import type {ProgressiveAggregate, ProgressiveAggregateQuery} from './query-progressive';

/** Executes a single-key grouped SQL scan and returns its final replacement table. */
export async function queryGroupedSQL(sql: string, options: QueryOptions): Promise<Table> {
  const statement = parseSQLSelectStatement(sql);
  const [key] = statement.groupBy ?? [];
  if (
    statement.groupBy?.length !== 1 ||
    key?.type !== 'Identifier' ||
    statement.joins.length ||
    statement.from.alias ||
    statement.having ||
    statement.orderBy?.length ||
    statement.limit !== undefined ||
    statement.offset !== undefined
  )
    throw new Error('Expected a single-source, single-key GROUP BY query');

  const [group, ...items] = statement.select ?? [];
  if (group?.expression.type !== 'Identifier' || group.expression.name !== key.name || group.alias)
    throw new Error('Select the grouping column first, followed by named aggregates');

  const aggregates = items.map(({expression, alias}): ProgressiveAggregate => {
    if (
      expression.type !== 'CallExpression' ||
      expression.callee.type !== 'Identifier' ||
      typeof expression.callee.name !== 'string' ||
      expression.arguments.length !== 1 ||
      !alias
    )
      throw new Error('Expected an aggregate with one column and an output alias');
    const operation = expression.callee.name.toLowerCase();
    if (
      operation !== 'count' &&
      operation !== 'sum' &&
      operation !== 'avg' &&
      operation !== 'min' &&
      operation !== 'max'
    )
      throw new Error('Unsupported grouped aggregate: ' + operation);
    const argument = expression.arguments[0];
    if (argument.type !== 'Identifier' || typeof argument.name !== 'string')
      throw new Error('Expected an aggregate column');
    const wildcard = 'sqlWildcard' in argument && argument.sqlWildcard === true;
    return {function: operation, column: wildcard ? undefined : argument.name, as: alias};
  });
  const grouped: ProgressiveAggregateQuery = {
    from:
      options.source !== undefined && statement.from.name === 'data'
        ? undefined
        : statement.from.name,
    groupBy: key.name,
    aggregates,
    where: statement.where && {expression: statement.where}
  };
  for await (const snapshot of queryProgressive(grouped, {
    ...options,
    emitEveryBatches: Number.MAX_SAFE_INTEGER
  })) {
    if (snapshot.final) return snapshot.table;
  }
  throw new Error('Grouped scan ended without a final snapshot');
}
