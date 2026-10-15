// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  ParquetColumnChunkMetadata,
  ParquetPredicate,
  ParquetPredicateValue,
  ParquetRowGroupMetadata
} from '../parquet-source-types';

/** One conservative Bloom-filter probe that can be applied before decoding a row group. */
export type ParquetBloomFilterProbe = {
  /** Column chunk containing the split-block Bloom filter. */
  readonly column: ParquetColumnChunkMetadata;
  /** Plain-encoded values to hash and probe. */
  readonly values: readonly ParquetPredicateValue[];
};

/**
 * Finds equality and membership predicates backed by row-group Bloom-filter metadata.
 *
 * Only leaves and conjunctions are returned. Disjunctions and negations are intentionally
 * excluded because probing an individual branch could otherwise create a false negative.
 */
export function getParquetBloomFilterProbes(
  predicate: ParquetPredicate,
  rowGroup: ParquetRowGroupMetadata
): ParquetBloomFilterProbe[] {
  const probes: ParquetBloomFilterProbe[] = [];
  collectParquetBloomFilterProbes(predicate, rowGroup, probes);
  const uniqueProbes = new Map<string, ParquetBloomFilterProbe>();
  for (const probe of probes) {
    const key = probe.column.path.join('\0');
    const previousProbe = uniqueProbes.get(key);
    if (previousProbe) {
      uniqueProbes.set(key, {
        column: probe.column,
        values: [...previousProbe.values, ...probe.values]
      });
    } else {
      uniqueProbes.set(key, probe);
    }
  }
  return [...uniqueProbes.values()];
}

function collectParquetBloomFilterProbes(
  predicate: ParquetPredicate,
  rowGroup: ParquetRowGroupMetadata,
  probes: ParquetBloomFilterProbe[]
): void {
  if (predicate.op === 'and') {
    for (const child of predicate.args) {
      collectParquetBloomFilterProbes(child, rowGroup, probes);
    }
    return;
  }
  if (predicate.op !== '=' && predicate.op !== 'in') {
    return;
  }
  const path =
    typeof predicate.args[0].property === 'string'
      ? [predicate.args[0].property]
      : [...predicate.args[0].property];
  const column = rowGroup.columns.find(
    candidate =>
      candidate.path.length === path.length &&
      candidate.path.every((part, index) => part === path[index])
  );
  if (
    !column ||
    column.bloomFilterOffset === undefined ||
    column.bloomFilterByteLength === undefined ||
    column.bloomFilterByteLength <= 0
  ) {
    return;
  }
  probes.push({
    column,
    values:
      predicate.op === '='
        ? [predicate.args[1]]
        : [...(predicate.args[1] as readonly ParquetPredicateValue[])]
  });
}
