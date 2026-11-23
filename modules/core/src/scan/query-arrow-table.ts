// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table} from 'apache-arrow';
import {needsPortablePredicateCompatibility} from './arrow-execution/portable-predicate-compatibility';
import {queryArrowTable as executeArrowQuery} from '@math.gl/sql/query';
import {
  queryArrowTable as planAndQueryArrowTable,
  type ArrowQueryOptions
} from './plan-arrow-table-query';

export {ARROW_TABLE_QUERY_CAPABILITIES, explainArrowTableQuery} from './plan-arrow-table-query';
export type {ArrowQueryOptions} from './plan-arrow-table-query';

/** Executes a validated Arrow query with math.gl as the linear executor. */
export function queryArrowTable(source: Table, options?: ArrowQueryOptions): Table {
  const predicate = options?.predicate;
  return planAndQueryArrowTable(
    source,
    options,
    predicate && needsPortablePredicateCompatibility(source.schema, predicate)
      ? undefined
      : executeArrowQuery,
    executeArrowQuery
  );
}
