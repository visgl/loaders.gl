// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Table, type RecordBatch, type Vector} from 'apache-arrow';
import {
  compileArrowScale,
  compileArrowScales,
  createStreamingDomainAccumulator,
  type CompiledArrowScale
} from '@math.gl/sql/arrow-scales';
import {
  parseSQLScaleExpression,
  type ParsedSQLScale,
  type ResolvedScale
} from '@math.gl/sql/scales';
import {makeArrowTableFromBatches} from '@loaders.gl/core/schema-utils';
import {query, queryInBatches, type Query, type QueryOptions} from './query';

/** Named row-preserving scale expressions applied to an input query result. */
export type ScaleProjections<Name extends string = string> = Readonly<
  Record<Name, string | ParsedSQLScale>
>;

/** Filtered input rows and scale outputs in the same row order. */
export type ScaleQueryResult<Name extends string = string> = Readonly<{
  /** Input rows after applying the table query, including any filter and row window. */
  table: Table;
  /** Arrow vectors keyed by scale projection name. */
  columns: Readonly<Record<Name, Vector>>;
  /** Scale evaluators and serializable descriptors shared with legend consumers. */
  scales: Readonly<Record<Name, ResolvedScale>>;
}>;

/** Resolves data-derived domains jointly, then evaluates each scale over the same rows. */
export async function queryScales<Name extends string>(
  input: Query | string,
  projections: ScaleProjections<Name>,
  options: QueryOptions
): Promise<ScaleQueryResult<Name>> {
  options.signal?.throwIfAborted();
  const parsed = parseScaleProjections(projections);
  const table = await query(input, options);
  options.signal?.throwIfAborted();
  return evaluateScaleProjections(table, compileArrowScales(table, parsed), options.signal);
}

/** Evaluates pre-bound scales and exposes their authoritative descriptors. */
function evaluateScaleProjections<Name extends string>(
  table: Table,
  compiled: Record<Name, CompiledArrowScale>,
  signal?: AbortSignal
): ScaleQueryResult<Name> {
  const names = Object.keys(compiled) as Name[];
  const columns = {} as Record<Name, Vector>;
  const scales = {} as Record<Name, ResolvedScale>;
  for (const name of names) {
    signal?.throwIfAborted();
    const scale = compiled[name];
    Object.defineProperty(columns, name, {value: scale.evaluate(table), enumerable: true});
    Object.defineProperty(scales, name, {value: scale.scale, enumerable: true});
  }
  return {table, columns, scales};
}

/** Parses scale expressions before starting a read and preserves projection names. */
function parseScaleProjections<Name extends string>(
  projections: ScaleProjections<Name>
): Record<Name, ParsedSQLScale> {
  return Object.fromEntries(
    Object.entries<string | ParsedSQLScale>(projections).map(([name, expression]) => [
      name,
      typeof expression === 'string' ? parseSQLScaleExpression(expression) : expression
    ])
  ) as Record<Name, ParsedSQLScale>;
}

/** Emits append-only scale projections using caller-supplied fixed domains. */
export async function* queryScalesInBatches<Name extends string>(
  input: Query | string,
  projections: ScaleProjections<Name>,
  options: QueryOptions
): AsyncIterable<ScaleQueryResult<Name>> {
  options.signal?.throwIfAborted();
  const parsed = parseScaleProjections(projections);
  if (Object.values<ParsedSQLScale>(parsed).some(({scale}) => scale.domain.type !== 'fixed')) {
    throw new Error('Append-only scale projections require fixed domains.');
  }
  /** Scales compiled once, using the schema from the first batch. */
  let compiled: Record<Name, CompiledArrowScale> | undefined;
  for await (const batch of queryInBatches(input, {...options, queryOutput: 'batches'})) {
    options.signal?.throwIfAborted();
    compiled ??= compileArrowScales(new Table(batch.schema), parsed);
    yield evaluateScaleProjections(new Table(batch.schema, [batch]), compiled, options.signal);
  }
}

/** Controls the cadence and retained row count of complete scale snapshots. */
export type ProgressiveScaleQueryOptions = QueryOptions &
  Readonly<{
    /** Emit a provisional snapshot after this many nonempty batches. Defaults to 16. */
    emitEveryBatches?: number;
    /** Maximum retained input rows for recoloring. Defaults to 100,000. */
    maxRetainedRows?: number;
    /** Retained samples per percentile column in the upstream quantile sketch. */
    quantileCapacity?: number;
  }>;

/** Complete scale outputs that replace the previous snapshot. */
export type ProgressiveScaleSnapshot<Name extends string = string> = ScaleQueryResult<Name> &
  Readonly<{
    /** Whether the source finished and the resolved domains are final. */
    final: boolean;
  }>;

/** Resolves progressive domains from one source pass and recolors retained rows on publication. */
export async function* queryScalesProgressive<Name extends string>(
  input: Query | string,
  projections: ScaleProjections<Name>,
  options: ProgressiveScaleQueryOptions
): AsyncIterable<ProgressiveScaleSnapshot<Name>> {
  const {emitEveryBatches = 16, maxRetainedRows = 100_000, quantileCapacity, signal} = options;
  signal?.throwIfAborted();
  if (
    !Number.isSafeInteger(emitEveryBatches) ||
    emitEveryBatches < 1 ||
    !Number.isSafeInteger(maxRetainedRows) ||
    maxRetainedRows < 1
  ) {
    throw new Error('Scale snapshot interval and row limit must be positive integers.');
  }
  const parsed = parseScaleProjections(projections);
  const entries = Object.entries<ParsedSQLScale>(parsed) as [Name, ParsedSQLScale][];
  if (entries.some(([, {scale}]) => scale.type === 'quantile')) {
    throw new Error('Progressive quantile classification requires a resolved Arrow scale binder.');
  }
  const accumulator = createStreamingDomainAccumulator(
    entries.map(([, {scale}]) => scale.domain),
    {quantileCapacity}
  );
  const batches: RecordBatch[] = [];
  let retainedRows = 0;
  let batchesSinceEmission = 0;
  let last: ScaleQueryResult<Name> | undefined;

  /** Binds the current statistics and evaluates the selected snapshot. */
  async function snapshot(): Promise<ScaleQueryResult<Name> | undefined> {
    const domains = accumulator.result();
    if (domains.some(domain => domain.length === 0)) return undefined;
    const table = await makeArrowTableFromBatches(batches);
    signal?.throwIfAborted();
    if (!table) return undefined;
    const schemaOnly = new Table(table.schema);
    const compiled = Object.fromEntries(
      entries.map(([name, expression], index) => [
        name,
        compileArrowScale(schemaOnly, expression, domains[index])
      ])
    ) as Record<Name, CompiledArrowScale>;
    return evaluateScaleProjections(table, compiled, signal);
  }

  for await (const batch of queryInBatches(input, {...options, queryOutput: 'batches'})) {
    signal?.throwIfAborted();
    retainedRows += batch.numRows;
    if (retainedRows > maxRetainedRows) {
      throw new Error(
        `Progressive scale query exceeded its retained row limit (${maxRetainedRows}).`
      );
    }
    batches.push(batch);
    if (batch.numRows === 0) continue;
    accumulator.update(batch);
    if (++batchesSinceEmission < emitEveryBatches) continue;
    last = await snapshot();
    if (last) {
      batchesSinceEmission = 0;
      yield {...last, final: false};
    }
  }
  signal?.throwIfAborted();
  const final = last && batchesSinceEmission === 0 ? last : await snapshot();
  if (!final) throw new Error('Progressive scale query could not resolve its domain.');
  yield {...final, final: true};
}
