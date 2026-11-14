// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Table, util, type Schema} from 'apache-arrow';
import type {SQLQuery} from '@math.gl/expressions/sql';
import {convertArrowToSchema, convertSchemaToArrow} from '@loaders.gl/core/schema-utils';
import type {
  TableQueryCapabilities,
  TableScanSource,
  TableQueryPushdownPlan
} from '@loaders.gl/core/loader-utils';

/** Source plan with an optional final Arrow projection. */
type NegotiatedQueryPlan = TableQueryPushdownPlan & {
  /** Completes the original SELECT list using the source's intermediate columns. */
  project?: (table: Table) => Table;
};

/** Negotiates exact whole-query execution only for sources that opt in, without reading rows. */
export async function planQueryPushdown(
  source: TableScanSource,
  query: Exclude<SQLQuery, {command: unknown}>,
  capabilities: TableQueryCapabilities | undefined,
  outputSchema: Schema,
  computed: boolean,
  inputSchema: Schema,
  signal?: AbortSignal
): Promise<NegotiatedQueryPlan | null> {
  const request = {...query};
  delete request.from;
  const plan = canPushdownQuery(request, capabilities, computed)
    ? await source.planQueryPushdown!(request, {signal})
    : null;
  if (!plan && computed && source.supportsQueryProjectionPushdown) {
    return planPartialProjection(source, request, capabilities, inputSchema, outputSchema, signal);
  }
  return validatePushdownPlan(plan, outputSchema, query.limit, signal);
}

/** Validates the schema before execution and on every physical batch. */
function validatePushdownPlan(
  plan: TableQueryPushdownPlan | null,
  outputSchema: Schema,
  limit?: number,
  signal?: AbortSignal
): TableQueryPushdownPlan | null {
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
        const native = !('shape' in batch);
        const schema = native ? batch.schema : batch.data.schema;
        const rowCount = native ? batch.numRows : batch.data.numRows;
        if (
          !util.compareSchemas(outputSchema, convertSchemaToArrow(convertArrowToSchema(schema)))
        ) {
          throw new Error('Query pushdown batch schema does not match the logical output schema.');
        }
        rowsReturned += rowCount;
        if (limit !== undefined && rowsReturned > limit) {
          throw new Error('Query pushdown returned more rows than the requested limit.');
        }
        yield native ? batch : {...batch, length: rowCount};
      }
    }
  };
}

/**
 * Splits SELECT items after filtering and windowing. The source must accept the entire
 * rewritten query so residual expressions see the original row set and order.
 */
async function planPartialProjection(
  source: TableScanSource,
  query: import('@loaders.gl/core/loader-utils').TableQueryPushdownRequest,
  capabilities: TableQueryCapabilities | undefined,
  inputSchema: Schema,
  outputSchema: Schema,
  signal?: AbortSignal
): Promise<NegotiatedQueryPlan | null> {
  if (!query.select) return null;
  const accepted = query.select.map(
    selection =>
      typeof selection !== 'string' &&
      ('expression' in selection || 'array' in selection) &&
      source.supportsQueryProjectionPushdown!(selection)
  );
  if (!accepted.some(Boolean) || accepted.every(Boolean)) return null;
  const {compileArrowProjection, getProjectionColumns} = await import(
    './arrow-execution/expressions'
  );
  const nativeSelections: NonNullable<typeof query.select>[number][] = [];
  const dependencies = new Set<string>();
  const occupied = new Set(inputSchema.fields.map(field => field.name.toLowerCase()));
  const residual = query.select.map((selection, index) => {
    const name = outputSchema.fields[index].name;
    if (accepted[index] && typeof selection !== 'string') {
      let alias = `__query_projection_${index}`;
      while (occupied.has(alias)) alias += '_';
      occupied.add(alias);
      nativeSelections.push({...selection, as: alias});
      return {column: alias, as: name};
    }
    for (const dependency of getProjectionColumns([selection])) dependencies.add(dependency);
    return typeof selection === 'string' ? selection : {...selection, as: name};
  });
  const request = {...query, select: [...dependencies, ...nativeSelections]};
  if (!canPushdownQuery(request, capabilities, true)) return null;
  const empty = new Table(inputSchema);
  const intermediate = compileArrowProjection(inputSchema, request.select, signal)(empty);
  const project = compileArrowProjection(intermediate.schema, residual, signal);
  const plan = await source.planQueryPushdown!(request, {signal});
  const checked = validatePushdownPlan(
    plan,
    convertSchemaToArrow(convertArrowToSchema(intermediate.schema)),
    query.limit,
    signal
  );
  return checked && {...checked, project};
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
