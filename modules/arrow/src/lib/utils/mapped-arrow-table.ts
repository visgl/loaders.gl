// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';

import {getIndexedRelativeAccessRow, normalizeIndexedArrowIndexes} from './indexed-arrow-helpers';
import {IndexedArrowTable} from './indexed-arrow-table';

import type {IndexedArrowTableRow} from './indexed-arrow-table';

const mappedArrowTableInitSymbol = Symbol('mapped-arrow-table-init');

type MappedArrowTableEntry = readonly [rowKey: string, rowIndex: number];
type MappedArrowTableInit = {
  [mappedArrowTableInitSymbol]: ReadonlyArray<MappedArrowTableEntry>;
};

/**
 * Predicate evaluated against one mapped Arrow table view row.
 *
 * @typeParam T - Backing Arrow column map shared with the source table.
 * @param table - Mapped table view currently being filtered.
 * @param rowIndex - Visible mapped-row index within the mapped view.
 * @returns `true` when the visible mapped row should remain in the filtered view.
 */
export type MappedArrowTablePredicate<T extends arrow.TypeMap> = (
  table: MappedArrowTable<T>,
  rowIndex: number
) => boolean;

/**
 * Comparator evaluated against two mapped Arrow table view rows.
 *
 * @typeParam T - Backing Arrow column map shared with the source table.
 * @param table - Mapped table view currently being sorted.
 * @param leftRowIndex - Left visible mapped-row index within the mapped view.
 * @param rightRowIndex - Right visible mapped-row index within the mapped view.
 * @returns Negative when the left mapped row should sort first, positive when the right mapped row
 * should sort first, or zero to preserve their current relative order.
 */
export type MappedArrowTableComparator<T extends arrow.TypeMap> = (
  table: MappedArrowTable<T>,
  leftRowIndex: number,
  rightRowIndex: number
) => number;

/**
 * Readonly string-keyed row lookup view layered on top of one indexed Arrow table.
 *
 * Duplicate keys are preserved in visible row order. Keyed lookups use last-wins semantics, so
 * `getByKey(key)` resolves to the last visible row with that key.
 *
 * @typeParam T - Backing Arrow column map shared with the source table.
 */
export class MappedArrowTable<T extends arrow.TypeMap> extends IndexedArrowTable<T> {
  /** Stable string-to-raw-row lookup map owned by this mapped view. */
  readonly rowIndexMap: Map<string, number>;
  /** String keys exposed in the current visible mapped-row order. Duplicate keys are preserved. */
  readonly rowKeys: string[];

  /**
   * Builds one string-keyed mapped Arrow table view.
   *
   * @param table - Backing Arrow table in raw row order.
   * @param rowIndexMap - Stable string-key-to-raw-row mapping to expose through this mapped view.
   * @param init - Internal marker preserving duplicate mapped entries when creating derived views.
   */
  constructor(
    table: arrow.Table<T>,
    rowIndexMap: ReadonlyMap<string, number>,
    init?: MappedArrowTableInit
  ) {
    const normalizedEntries = normalizeMappedArrowEntries(
      init?.[mappedArrowTableInitSymbol] ?? Array.from(rowIndexMap.entries()),
      table.numRows
    );

    super(
      table,
      normalizeIndexedArrowIndexes(
        normalizedEntries.map(([, rowIndex]) => rowIndex),
        table.numRows
      )
    );

    this.rowIndexMap = buildMappedArrowRowIndexMap(normalizedEntries);
    this.rowKeys = normalizedEntries.map(([rowKey]) => rowKey);
  }

  /**
   * Resolves one raw backing-table row index by mapped string key.
   *
   * @param rowKey - Stable mapped key owned by this view.
   * @returns Raw row index in the backing table, or `null` when the key is not present.
   */
  getRowIndex(rowKey: string): number | null {
    return this.rowIndexMap.get(rowKey) ?? null;
  }

  /**
   * Resolves one mapped key by view-local row index.
   *
   * @param rowIndex - Visible mapped-row index within this view.
   * @returns Mapped key for the visible row index, or `null` when the index is invalid.
   */
  getRowKey(rowIndex: number): string | null {
    if (!Number.isInteger(rowIndex) || rowIndex < 0 || rowIndex >= this.rowKeys.length) {
      return null;
    }

    return this.rowKeys[rowIndex] ?? null;
  }

  /**
   * Resolves one row object by mapped string key.
   *
   * @param rowKey - Stable mapped key owned by this view.
   * @returns Materialized Arrow row for the mapped key, or `null` when the key is not present.
   */
  getByKey(rowKey: string): IndexedArrowTableRow<T> | null {
    const rowIndex = this.getRowIndex(rowKey);
    return rowIndex === null ? null : this.table.get(rowIndex);
  }

  /**
   * Resolves one row object by relative mapped-row index.
   *
   * @param rowIndex - Relative mapped-row index using `Array.prototype.at` semantics.
   * @returns Materialized Arrow row for the resolved mapped-row index, or `null` when the index is
   * invalid.
   */
  atMapped(rowIndex: number): IndexedArrowTableRow<T> | null {
    const normalizedIndex = getIndexedRelativeAccessRow(this.numRows, rowIndex);
    return normalizedIndex === null ? null : this.get(normalizedIndex);
  }

  /**
   * Returns one sliced mapped view over the same backing Arrow table.
   *
   * @param begin - Optional inclusive mapped-row start index.
   * @param end - Optional exclusive mapped-row end index.
   * @returns New mapped view sharing the same backing Arrow table over the sliced mapped rows.
   */
  override slice(begin?: number, end?: number): MappedArrowTable<T> {
    return createMappedArrowTableFromEntries(
      this.table,
      getMappedEntriesSlice(this.rowKeys, this.indexes, begin, end)
    );
  }

  /**
   * Returns one filtered mapped view over the same backing Arrow table.
   *
   * @param predicate - Visible mapped-row predicate evaluated against this mapped view.
   * @returns New mapped view containing only rows whose predicate result is `true`.
   */
  override filter(predicate: MappedArrowTablePredicate<T>): MappedArrowTable<T> {
    return createMappedArrowTableFromEntries(this.table, getFilteredMappedEntries(this, predicate));
  }

  /**
   * Returns one sorted mapped view over the same backing Arrow table.
   *
   * @param compare - Visible mapped-row comparator evaluated against this mapped view.
   * @returns New mapped view whose visible rows follow the comparator order.
   */
  override sort(compare: MappedArrowTableComparator<T>): MappedArrowTable<T> {
    return createMappedArrowTableFromEntries(this.table, getSortedMappedEntries(this, compare));
  }

  /**
   * Concatenates this mapped view with other mapped views sharing the same Arrow schema.
   *
   * The returned view owns a new backing Arrow table assembled from the input tables' record
   * batches, preserves visible mapped-row order including duplicate keys, and resolves keyed
   * lookups to the last visible occurrence.
   *
   * @param others - Additional mapped views to append after this view.
   * @returns Mapped view over a concatenated backing Arrow table.
   */
  override concat(...others: MappedArrowTable<T>[]): MappedArrowTable<T> {
    const concatenatedIndexedTable = super.concat(...others);
    return createMappedArrowTableFromEntries(
      concatenatedIndexedTable.table,
      getConcatenatedMappedEntries([this, ...others])
    );
  }
}

/**
 * Builds one mapped Arrow table from visible mapped-row entries without collapsing duplicate keys.
 */
function createMappedArrowTableFromEntries<T extends arrow.TypeMap>(
  table: arrow.Table<T>,
  entries: ReadonlyArray<MappedArrowTableEntry>
): MappedArrowTable<T> {
  const rowIndexMap = buildMappedArrowRowIndexMap(entries);
  return new MappedArrowTable(table, rowIndexMap, {
    [mappedArrowTableInitSymbol]: entries
  });
}

/**
 * Builds a last-wins row-index map from visible mapped-row entries.
 */
function buildMappedArrowRowIndexMap(
  entries: ReadonlyArray<MappedArrowTableEntry>
): Map<string, number> {
  const rowIndexMap = new Map<string, number>();

  for (const [rowKey, rowIndex] of entries) {
    rowIndexMap.set(rowKey, rowIndex);
  }

  return rowIndexMap;
}

/**
 * Returns the mapped entries that remain after filtering one mapped Arrow table view.
 */
function getFilteredMappedEntries<T extends arrow.TypeMap>(
  table: MappedArrowTable<T>,
  predicate: MappedArrowTablePredicate<T>
): Array<[string, number]> {
  const nextEntries: Array<[string, number]> = [];

  for (let rowIndex = 0; rowIndex < table.numRows; rowIndex++) {
    if (predicate(table, rowIndex)) {
      const rowKey = table.rowKeys[rowIndex];
      const rawIndex = table.indexes[rowIndex];
      nextEntries.push([rowKey, rawIndex]);
    }
  }

  return nextEntries;
}

/**
 * Returns the mapped entries that remain after sorting one mapped Arrow table view.
 */
function getSortedMappedEntries<T extends arrow.TypeMap>(
  table: MappedArrowTable<T>,
  compare: MappedArrowTableComparator<T>
): Array<[string, number]> {
  const rowIndexes = Array.from({length: table.numRows}, (_, rowIndex) => rowIndex);
  rowIndexes.sort((leftRowIndex, rightRowIndex) => compare(table, leftRowIndex, rightRowIndex));

  return rowIndexes.map(rowIndex => [table.rowKeys[rowIndex], table.indexes[rowIndex]] as const);
}

/**
 * Returns one owned slice of mapped entries in visible mapped-row order.
 */
function getMappedEntriesSlice(
  rowKeys: readonly string[],
  rowIndexes: Int32Array,
  begin?: number,
  end?: number
): Array<MappedArrowTableEntry> {
  const slicedRowKeys = rowKeys.slice(begin, end);
  const slicedRowIndexes = rowIndexes.slice(begin, end);
  return slicedRowKeys.map((rowKey, rowIndex) => [rowKey, slicedRowIndexes[rowIndex]] as const);
}

/**
 * Returns concatenated mapped entries with backing-table row offsets applied per input view.
 */
function getConcatenatedMappedEntries<T extends arrow.TypeMap>(
  tables: readonly MappedArrowTable<T>[]
): Array<MappedArrowTableEntry> {
  const concatenatedEntries: Array<MappedArrowTableEntry> = [];
  let tableRowOffset = 0;

  for (const table of tables) {
    for (let rowIndex = 0; rowIndex < table.numRows; rowIndex++) {
      concatenatedEntries.push([table.rowKeys[rowIndex], table.indexes[rowIndex] + tableRowOffset]);
    }
    tableRowOffset += table.table.numRows;
  }

  return concatenatedEntries;
}

/**
 * Normalizes one list of mapped raw row-index entries into owned entries.
 */
function normalizeMappedArrowEntries(
  entries: ReadonlyArray<MappedArrowTableEntry>,
  maxExclusive: number
): Array<MappedArrowTableEntry> {
  const normalizedEntries = Array.from(entries);
  const normalizedIndexes = normalizeIndexedArrowIndexes(
    normalizedEntries.map(([, rowIndex]) => rowIndex),
    maxExclusive
  );

  return normalizedEntries.map(
    ([rowKey], rowIndex) => [rowKey, normalizedIndexes[rowIndex]] as const
  );
}
