// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table, Vector} from 'apache-arrow';
import {compileArrowScales} from '@math.gl/sql/arrow-scales';
import {
  parseSQLScaleExpression,
  type ParsedSQLScale,
  type ResolvedScale
} from '@math.gl/sql/scales';
import {query, type Query, type QueryOptions} from './query';

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
  const compiled = compileArrowScales(table, parsed);
  const names = Object.keys(parsed) as Name[];
  const columns = {} as Record<Name, Vector>;
  const scales = {} as Record<Name, ResolvedScale>;
  for (const name of names) {
    options.signal?.throwIfAborted();
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
