// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Returns the raw row index for one view-local access if it is a valid integer index.
 */
export function getIndexedAccessRow(indexes: Int32Array, rowIndex: number): number | null {
  if (!Number.isInteger(rowIndex) || rowIndex < 0 || rowIndex >= indexes.length) {
    return null;
  }

  return indexes[rowIndex] ?? null;
}

/**
 * Returns the normalized row index for one relative `.at()`-style access.
 */
export function getIndexedRelativeAccessRow(length: number, rowIndex: number): number | null {
  if (!Number.isInteger(rowIndex)) {
    return null;
  }

  const normalizedIndex = rowIndex >= 0 ? rowIndex : length + rowIndex;
  if (normalizedIndex < 0 || normalizedIndex >= length) {
    return null;
  }

  return normalizedIndex;
}

/**
 * Normalizes raw Arrow row indexes into an owned `Int32Array`.
 *
 * @param indexes - Raw Arrow row indexes to validate and normalize.
 * @param maxExclusive - Exclusive upper bound for valid raw row indexes.
 * @param copy - When `false`, reuses an owned `Int32Array` input after validation instead of
 * copying it into a new typed array.
 * @returns Validated row indexes in a typed array.
 */
export function normalizeIndexedArrowIndexes(
  indexes: readonly number[] | Int32Array,
  maxExclusive: number,
  copy = true
): Int32Array {
  const normalizedIndexes =
    !copy && indexes instanceof Int32Array ? indexes : Int32Array.from(indexes);

  if (normalizedIndexes.length !== indexes.length) {
    throw new RangeError('Indexed Arrow row indexes must be finite integers.');
  }

  for (let rowIndex = 0; rowIndex < normalizedIndexes.length; rowIndex++) {
    const rawIndex = indexes[rowIndex];
    if (!Number.isInteger(rawIndex) || rawIndex < 0 || rawIndex >= maxExclusive) {
      throw new RangeError(
        `Indexed Arrow row index ${String(rawIndex)} at position ${rowIndex} is out of range for table length ${maxExclusive}.`
      );
    }
  }

  return normalizedIndexes;
}
