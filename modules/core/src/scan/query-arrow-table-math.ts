// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table} from 'apache-arrow';
import {queryArrowTable as executeArrowQuery} from '@math.gl/sql/query';
import {
  queryArrowTable as planAndQueryArrowTable,
  type ArrowQueryOptions
} from './query-arrow-table';

/** Executes a validated Arrow query with math.gl as the linear executor. */
export function queryArrowTable(source: Table, options?: ArrowQueryOptions): Table {
  return planAndQueryArrowTable(source, options, executeArrowQuery);
}
