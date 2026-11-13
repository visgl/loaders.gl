// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {util, type Schema} from 'apache-arrow';
import type {SQLQuery} from '@math.gl/expressions/sql';
import {convertArrowToSchema, convertSchemaToArrow} from '@loaders.gl/core/schema-utils';
import type {
  TableQueryCapabilities,
  TableScanSource,
  TableQueryPushdownPlan
} from '@loaders.gl/core/loader-utils';

/** Negotiates exact whole-query execution only for sources that opt in, without reading rows. */
export async function planQueryPushdown(
  source: TableScanSource,
  query: Exclude<SQLQuery, {command: unknown}>,
  capabilities: TableQueryCapabilities | undefined,
  outputSchema: Schema,
  computed: boolean,
  signal?: AbortSignal
): Promise<TableQueryPushdownPlan | null> {
  if (!canPushdownQuery(query, capabilities, computed)) return null;
  const request = {...query};
  delete request.from;
  const plan = await source.planQueryPushdown!(request, {signal});
  signal?.throwIfAborted();
  if (plan && !util.compareSchemas(outputSchema, convertSchemaToArrow(plan.schema))) {
    throw new Error('Query pushdown schema does not match the logical output schema.');
  }
  if (!plan) return null;
  return {
    schema: plan.schema,
    /** Validates native output lazily and closes its iterator on failure or consumer return. */
    async *read(options = {}) {
      let rowsReturned = 0;
      for await (const batch of plan.read(options)) {
        options.signal?.throwIfAborted();
        if (
          !util.compareSchemas(
            outputSchema,
            convertSchemaToArrow(convertArrowToSchema(batch.data.schema))
          )
        ) {
          throw new Error('Query pushdown batch schema does not match the logical output schema.');
        }
        rowsReturned += batch.data.numRows;
        if (query.limit !== undefined && rowsReturned > query.limit) {
          throw new Error('Query pushdown returned more rows than the requested limit.');
        }
        yield {...batch, length: batch.data.numRows};
      }
    }
  };
}

/** Uses effective source capabilities as a ceiling before asking for exact query acceptance. */
function canPushdownQuery(
  query: Exclude<SQLQuery, {command: unknown}>,
  capabilities: TableQueryCapabilities | undefined,
  computed: boolean
): boolean {
  if (!capabilities) return false;
  const supports = (support: string | undefined): boolean =>
    support === 'pushdown' || support === 'pushdown+residual';
  return (
    (!query.select || supports(capabilities.projection)) &&
    (!query.where || supports(capabilities.predicate)) &&
    (!computed || !containsNonCastExpression(query) || supports(capabilities.expressions)) &&
    (!containsQueryCast(query) || supports(capabilities.cast)) &&
    (query.offset === undefined || supports(capabilities.offset)) &&
    (query.limit === undefined || supports(capabilities.limit))
  );
}

/** Recognizes both parsed expression CAST calls and portable predicate cast annotations. */
function containsQueryCast(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(containsQueryCast);
  const node = value as Record<string, unknown>;
  if (Array.isArray(node.casts) && node.casts.length) return true;
  if (
    node.type === 'CallExpression' &&
    node.callee &&
    typeof node.callee === 'object' &&
    'name' in node.callee &&
    String(node.callee.name).toLowerCase() === 'cast'
  )
    return true;
  return Object.values(node).some(containsQueryCast);
}

/** CAST-only expressions use the independent cast capability; other computation needs expressions. */
function containsNonCastExpression(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(containsNonCastExpression);
  const node = value as Record<string, unknown>;
  if (Array.isArray(node.array)) return true;
  if (typeof node.type === 'string' && !['Identifier', 'Literal'].includes(node.type)) {
    if (
      node.type !== 'CallExpression' ||
      !node.callee ||
      typeof node.callee !== 'object' ||
      !('name' in node.callee) ||
      String(node.callee.name).toLowerCase() !== 'cast'
    )
      return true;
  }
  return Object.values(node).some(containsNonCastExpression);
}
