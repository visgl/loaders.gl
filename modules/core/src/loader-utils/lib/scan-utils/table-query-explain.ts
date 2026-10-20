// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getColumnarPredicateColumns,
  type ColumnarPredicate,
  type ColumnarPredicateProperty
} from './columnar-predicate';
import {
  planTableQuery,
  type TableQueryCapabilities,
  type TableQueryOptions,
  type TableQueryPlan,
  type TableQueryOperatorSupport
} from './table-query';

/** A capability annotation for one operator in an explainable table query. */
export type TableQueryExplainOperator = Readonly<{
  /** Whether this operator is present in the requested query. */
  enabled: boolean;
  /** Physical implementation available to the backend. */
  support: TableQueryOperatorSupport;
}>;

/** Serializable logical and physical capability information for one table query. */
export type TableQueryExplain<PredicateT = ColumnarPredicate> = Readonly<{
  /** Columns exposed by the source before planning. */
  sourceColumns: readonly string[];
  /** Columns returned by the query. */
  outputColumns: readonly string[];
  /** Columns that must be read to evaluate the query correctly. */
  requiredColumns: readonly string[];
  /** Columns referenced by the predicate, including hidden filter columns. */
  predicateColumns: readonly string[];
  /** Canonical logical scan plan. */
  plan: TableQueryPlan<PredicateT>;
  /** Backend capabilities used to annotate the logical plan. */
  capabilities: TableQueryCapabilities;
  /** Per-operator pushed-versus-residual diagnostics. */
  operators: Readonly<{
    projection: TableQueryExplainOperator;
    predicate: TableQueryExplainOperator;
    limit: TableQueryExplainOperator;
  }>;
}>;

/**
 * Creates a serializable explanation without executing a table scan.
 *
 * This deliberately reports both the backend-neutral plan and the backend's advertised
 * implementation level. Executors can add source-specific details (for example row-group
 * pruning) while retaining this stable shape.
 */
export function explainTableQuery<
  ValueT,
  PropertyT extends ColumnarPredicateProperty,
  PredicateT extends ColumnarPredicate<ValueT, PropertyT>
>(
  sourceColumnNames: readonly string[],
  options: TableQueryOptions<PredicateT>,
  capabilities: TableQueryCapabilities
): TableQueryExplain<PredicateT> {
  const plan = planTableQuery(sourceColumnNames, options);
  const outputColumns = options.columns ? [...options.columns] : [...sourceColumnNames];
  const predicateColumns = options.predicate ? getColumnarPredicateColumns(options.predicate) : [];
  const requiredColumns = [...(plan[0].kind === 'scan' ? plan[0].columns : [])];
  return Object.freeze({
    sourceColumns: Object.freeze([...sourceColumnNames]),
    outputColumns: Object.freeze(outputColumns),
    requiredColumns: Object.freeze(requiredColumns),
    predicateColumns: Object.freeze(predicateColumns),
    plan,
    capabilities: Object.freeze({...capabilities}),
    operators: Object.freeze({
      projection: createOperatorExplanation(options.columns !== undefined, capabilities.projection),
      predicate: createOperatorExplanation(options.predicate !== undefined, capabilities.predicate),
      limit: createOperatorExplanation(options.limit !== undefined, capabilities.limit)
    })
  });
}

function createOperatorExplanation(
  enabled: boolean,
  support: TableQueryOperatorSupport
): TableQueryExplainOperator {
  return Object.freeze({enabled, support});
}
