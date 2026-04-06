// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';

import {
  getIndexedAccessRow,
  getIndexedRelativeAccessRow,
  normalizeIndexedArrowIndexes
} from './indexed-arrow-helpers';
import {IndexedArrowVector} from './indexed-arrow-vector';

const indexedArrowTableInitSymbol = Symbol('indexed-arrow-table-init');

/**
 * Arrow row type preserved by one indexed Arrow table view.
 *
 * @typeParam T - Backing Arrow column map shared with the source table.
 */
export type IndexedArrowTableRow<T extends arrow.TypeMap> = arrow.Struct<T>['TValue'];

/**
 * Predicate evaluated against one indexed Arrow table view row.
 *
 * @typeParam T - Backing Arrow column map shared with the source table.
 * @param table - Indexed table view currently being filtered.
 * @param rowIndex - Visible row index within the indexed view.
 * @returns `true` when the visible row should remain in the filtered view.
 */
export type IndexedArrowTablePredicate<T extends arrow.TypeMap> = (
  table: IndexedArrowTable<T>,
  rowIndex: number
) => boolean;

/**
 * Comparator evaluated against two indexed Arrow table view rows.
 *
 * @typeParam T - Backing Arrow column map shared with the source table.
 * @param table - Indexed table view currently being sorted.
 * @param leftRowIndex - Left visible row index within the indexed view.
 * @param rightRowIndex - Right visible row index within the indexed view.
 * @returns Negative when the left row should sort first, positive when the right row should sort
 * first, or zero to preserve their current relative order.
 */
export type IndexedArrowTableComparator<T extends arrow.TypeMap> = (
  table: IndexedArrowTable<T>,
  leftRowIndex: number,
  rightRowIndex: number
) => number;

/**
 * Predicate evaluated against one indexed Arrow table row for array-like search helpers.
 *
 * @typeParam T - Backing Arrow column map shared with the source table.
 * @param row - Materialized visible row at the current indexed position.
 * @param rowIndex - Visible row index within the indexed view.
 * @param table - Indexed table view currently being searched.
 * @returns `true` when the current visible row matches the requested condition.
 */
export type IndexedArrowTableFindPredicate<T extends arrow.TypeMap> = (
  row: IndexedArrowTableRow<T> | null,
  rowIndex: number,
  table: IndexedArrowTable<T>
) => boolean;

/**
 * Readonly indexed row and column view over one backing Arrow table.
 *
 * A visible row index is the row position inside this view. A raw row index is the row position in
 * the backing Arrow table. The view stores raw row indexes and does not copy table data until
 * callers materialize a table or array.
 *
 * @typeParam T - Backing Arrow column map shared with the source table.
 */
export class IndexedArrowTable<T extends arrow.TypeMap> {
  /** Backing Arrow table in raw row order. */
  readonly table: arrow.Table<T>;
  /** Backing Arrow schema shared across all indexed views of the same table. */
  readonly schema: arrow.Schema<T>;
  /** Raw row indexes exposed by this indexed view. Duplicate indexes are preserved. */
  readonly indexes: Int32Array;
  /** Scratch row object reused by `getTemporaryRow(...)` to avoid repeated row allocations. */
  private temporaryRow?: IndexedArrowTableRow<T>;

  /**
   * Builds one indexed Arrow table view from an owned typed index buffer without copying it.
   *
   * Callers must not mutate `indexes` after handing ownership to the indexed table.
   *
   * @typeParam T - Backing Arrow column map shared with the source table.
   * @param table - Backing Arrow table in raw row order.
   * @param indexes - Owned typed raw-row indexes to expose through this view.
   * @returns Indexed view adopting the provided typed index buffer.
   */
  static fromOwnedIndexes<T extends arrow.TypeMap>(
    table: arrow.Table<T>,
    indexes: Int32Array
  ): IndexedArrowTable<T> {
    return new IndexedArrowTable(table, indexes, indexedArrowTableInitSymbol);
  }

  /**
   * Builds one indexed Arrow table view.
   *
   * @param table - Backing Arrow table in raw row order.
   * @param indexes - Optional raw-row indexes to expose through this view. When omitted, the view
   * acts as a full passthrough over every raw row.
   * @param init - Internal marker enabling adoption of owned typed indexes without copying them.
   */
  constructor(table: arrow.Table<T>, indexes?: readonly number[] | Int32Array);
  constructor(table: arrow.Table<T>, indexes: Int32Array, init: typeof indexedArrowTableInitSymbol);
  constructor(
    table: arrow.Table<T>,
    indexes?: readonly number[] | Int32Array,
    init?: typeof indexedArrowTableInitSymbol
  ) {
    this.table = table;
    this.schema = table.schema;
    this.indexes =
      indexes === undefined
        ? Int32Array.from({length: table.numRows}, (_, rowIndex) => rowIndex)
        : normalizeIndexedArrowIndexes(
            indexes,
            table.numRows,
            init !== indexedArrowTableInitSymbol
          );
  }

  /**
   * Number of visible rows exposed through this indexed table.
   *
   * @returns Count of visible rows in the indexed view.
   */
  get numRows(): number {
    return this.indexes.length;
  }

  /**
   * Number of columns exposed through the backing Arrow schema.
   *
   * @returns Count of schema columns shared with the backing Arrow table.
   */
  get numCols(): number {
    return this.table.numCols;
  }

  /**
   * Resolves one raw backing-table row index by view-local row index.
   *
   * @param rowIndex - Visible row index within the indexed view.
   * @returns Raw row index in the backing table, or `null` when the visible index is invalid.
   */
  getRawIndex(rowIndex: number): number | null {
    return getIndexedAccessRow(this.indexes, rowIndex);
  }

  /**
   * Resolves one row object by view-local row index.
   *
   * @param rowIndex - Visible row index within the indexed view.
   * @returns Materialized Arrow row for the visible row index, or `null` when the index is invalid.
   */
  get(rowIndex: number): IndexedArrowTableRow<T> | null {
    const rawIndex = this.getRawIndex(rowIndex);
    return rawIndex === null ? null : this.table.get(rawIndex);
  }

  /**
   * Resolves one visible row into a reusable scratch object owned by this indexed table.
   *
   * The returned object is mutated in place and reused by the next `getTemporaryRow(...)` call on
   * the same indexed view. Callers must copy any values they need to retain beyond the immediate
   * read.
   *
   * @param rowIndex - Visible row index within the indexed view.
   * @returns Reusable scratch row for the visible row index, or `null` when the index is invalid.
   */
  getTemporaryRow(rowIndex: number): IndexedArrowTableRow<T> | null {
    const rawIndex = this.getRawIndex(rowIndex);
    if (rawIndex === null) {
      return null;
    }

    const temporaryRow =
      this.temporaryRow ??
      ((this.temporaryRow = Object.create(null) as IndexedArrowTableRow<T>), this.temporaryRow);
    const mutableTemporaryRow = temporaryRow as Record<keyof T & string, unknown>;

    for (const field of this.schema.fields) {
      const columnName = field.name as keyof T & string;
      const childVector = getCachedRawChildVector(this.table, columnName);
      mutableTemporaryRow[columnName] = childVector
        ? (childVector.get(rawIndex) ?? undefined)
        : undefined;
    }

    return temporaryRow;
  }

  /**
   * Resolves one row object by relative view-local row index.
   *
   * @param rowIndex - Relative visible row index using `Array.prototype.at` semantics.
   * @returns Materialized Arrow row for the resolved visible row index, or `null` when the index is
   * invalid.
   */
  at(rowIndex: number): IndexedArrowTableRow<T> | null {
    const normalizedIndex = getIndexedRelativeAccessRow(this.numRows, rowIndex);
    return normalizedIndex === null ? null : this.get(normalizedIndex);
  }

  /**
   * Resolves one typed column value by view-local row index.
   *
   * @typeParam P - Column name being read from the backing Arrow schema.
   * @param rowIndex - Visible row index within the indexed view.
   * @param columnName - Backing Arrow column name to read.
   * @returns Typed column value for the visible row, or `null` when the row index or column is not
   * available.
   */
  getValue<P extends keyof T & string>(rowIndex: number, columnName: P): T[P]['TValue'] | null {
    const rawIndex = this.getRawIndex(rowIndex);
    if (rawIndex === null) {
      return null;
    }

    const childVector = getCachedRawChildVector(this.table, columnName);
    return childVector ? (childVector.get(rawIndex) ?? null) : null;
  }

  /**
   * Resolves one indexed child-column view.
   *
   * @typeParam P - Column name being read from the backing Arrow schema.
   * @param columnName - Backing Arrow column name to expose as an indexed child-vector view.
   * @returns Indexed child-vector view for the requested column, or `null` when the column is not
   * present on the backing table.
   */
  getChild<P extends keyof T & string>(columnName: P): IndexedArrowVector<T[P]> | null {
    let childViewCache = indexedChildVectorCache.get(this);
    if (!childViewCache) {
      childViewCache = new Map();
      indexedChildVectorCache.set(this, childViewCache);
    }

    if (!childViewCache.has(columnName)) {
      const childVector = getCachedRawChildVector(this.table, columnName);
      childViewCache.set(
        columnName,
        childVector ? new IndexedArrowVector(childVector, this.indexes) : null
      );
    }

    return (childViewCache.get(columnName) as IndexedArrowVector<T[P]> | null | undefined) ?? null;
  }

  /**
   * Returns one sliced indexed view over the same backing Arrow table.
   *
   * @param begin - Optional inclusive visible-row start index.
   * @param end - Optional exclusive visible-row end index.
   * @returns New indexed view sharing the same backing Arrow table over the sliced visible rows.
   */
  slice(begin?: number, end?: number): IndexedArrowTable<T> {
    return IndexedArrowTable.fromOwnedIndexes(this.table, this.indexes.slice(begin, end));
  }

  /**
   * Returns one filtered indexed view over the same backing Arrow table.
   *
   * @param predicate - Visible-row predicate evaluated against this indexed view.
   * @returns New indexed view containing only rows whose predicate result is `true`.
   */
  filter(predicate: IndexedArrowTablePredicate<T>): IndexedArrowTable<T> {
    const nextIndexes: number[] = [];

    for (let rowIndex = 0; rowIndex < this.numRows; rowIndex++) {
      if (predicate(this, rowIndex)) {
        nextIndexes.push(this.indexes[rowIndex]);
      }
    }

    return new IndexedArrowTable(this.table, nextIndexes);
  }

  /**
   * Returns one sorted indexed view over the same backing Arrow table.
   *
   * @param compare - Visible-row comparator evaluated against this indexed view.
   * @returns New indexed view whose visible rows follow the comparator order.
   */
  sort(compare: IndexedArrowTableComparator<T>): IndexedArrowTable<T> {
    const rowIndexes = Array.from({length: this.numRows}, (_, rowIndex) => rowIndex);
    rowIndexes.sort((leftRowIndex, rightRowIndex) => compare(this, leftRowIndex, rightRowIndex));

    return new IndexedArrowTable(
      this.table,
      rowIndexes.map((rowIndex) => this.indexes[rowIndex])
    );
  }

  /**
   * Concatenates this indexed view with other indexed views sharing the same Arrow schema.
   *
   * The returned view owns a new backing Arrow table assembled from the input tables' record
   * batches while preserving each input view's visible row order.
   *
   * @param others - Additional indexed views to append after this view.
   * @returns Indexed view over a concatenated backing Arrow table with appended visible indexes.
   */
  concat(...others: IndexedArrowTable<T>[]): IndexedArrowTable<T> {
    const sourceTables = [this, ...others];

    for (const sourceTable of sourceTables.slice(1)) {
      if (!areArrowSchemasCompatible(this.schema, sourceTable.schema)) {
        throw new Error('IndexedArrowTable.concat requires identical Arrow schemas.');
      }
    }

    const concatenatedTable = this.table.concat(...others.map((sourceTable) => sourceTable.table));
    const concatenatedIndexes = new Int32Array(
      sourceTables.reduce((count, sourceTable) => count + sourceTable.numRows, 0)
    );

    let viewOffset = 0;
    let tableRowOffset = 0;
    for (const sourceTable of sourceTables) {
      for (let rowIndex = 0; rowIndex < sourceTable.numRows; rowIndex++) {
        concatenatedIndexes[viewOffset + rowIndex] = sourceTable.indexes[rowIndex] + tableRowOffset;
      }
      viewOffset += sourceTable.numRows;
      tableRowOffset += sourceTable.table.numRows;
    }

    return IndexedArrowTable.fromOwnedIndexes(concatenatedTable, concatenatedIndexes);
  }

  /**
   * Finds the first visible row that matches the supplied predicate.
   *
   * @param predicate - Search predicate evaluated against visible rows in indexed order.
   * @returns First matching visible row, or `undefined` when no visible row matches.
   */
  find(predicate: IndexedArrowTableFindPredicate<T>): IndexedArrowTableRow<T> | undefined {
    const rowIndex = this.findIndex(predicate);
    return rowIndex === -1 ? undefined : (this.get(rowIndex) ?? undefined);
  }

  /**
   * Finds the first visible row index that matches the supplied predicate.
   *
   * @param predicate - Search predicate evaluated against visible rows in indexed order.
   * @returns First matching visible row index, or `-1` when no visible row matches.
   */
  findIndex(predicate: IndexedArrowTableFindPredicate<T>): number {
    for (let rowIndex = 0; rowIndex < this.numRows; rowIndex++) {
      if (predicate(this.get(rowIndex), rowIndex, this)) {
        return rowIndex;
      }
    }

    return -1;
  }

  /**
   * Materializes the visible indexed rows into one concrete Arrow table snapshot.
   *
   * @returns Arrow table containing the current visible rows in indexed order, including duplicate
   * rows when duplicate indexes are present.
   */
  materializeArrowTable(): arrow.Table<T> {
    const materializedColumns = Object.fromEntries(
      this.schema.fields.map((field) => {
        const columnName = field.name as keyof T & string;
        const childView = this.getChild(columnName);
        if (!childView) {
          throw new Error(`Missing Arrow child vector for column "${field.name}"`);
        }

        return [field.name, arrow.vectorFromArray(childView.toArray(), field.type)] as const;
      })
    );

    return new (arrow.Table as any)(this.schema, materializedColumns) as arrow.Table<T>;
  }

  /**
   * Materializes the visible indexed rows into a JavaScript array.
   *
   * @returns Array of materialized visible rows in indexed order.
   */
  toArray(): Array<IndexedArrowTableRow<T> | null> {
    return Array.from(this);
  }

  /**
   * Iterates over visible rows in indexed row order.
   *
   * @returns Iterator over materialized visible rows in indexed row order.
   */
  *[Symbol.iterator](): IterableIterator<IndexedArrowTableRow<T> | null> {
    for (let rowIndex = 0; rowIndex < this.numRows; rowIndex++) {
      yield this.get(rowIndex);
    }
  }
}

/**
 * Returns whether two Arrow schemas are compatible for batch-level concatenation.
 */
function areArrowSchemasCompatible<T extends arrow.TypeMap>(
  left: arrow.Schema<T>,
  right: arrow.Schema<T>
): boolean {
  if (left === right) {
    return true;
  }

  if (
    left.fields.length !== right.fields.length ||
    left.metadataVersion !== right.metadataVersion ||
    !areArrowMetadataMapsEqual(left.metadata, right.metadata)
  ) {
    return false;
  }

  return left.fields.every((field, fieldIndex) => {
    const otherField = right.fields[fieldIndex];
    return (
      otherField !== null &&
      otherField !== undefined &&
      field.name === otherField.name &&
      field.nullable === otherField.nullable &&
      field.typeId === otherField.typeId &&
      String(field.type) === String(otherField.type) &&
      areArrowMetadataMapsEqual(field.metadata, otherField.metadata)
    );
  });
}

/**
 * Returns whether two Arrow metadata maps contain the same ordered key/value pairs.
 */
function areArrowMetadataMapsEqual(
  left: ReadonlyMap<string, string>,
  right: ReadonlyMap<string, string>
): boolean {
  if (left.size !== right.size) {
    return false;
  }

  for (const [key, value] of left.entries()) {
    if (right.get(key) !== value) {
      return false;
    }
  }

  return true;
}

const rawChildVectorCache = new WeakMap<object, Map<string, arrow.Vector<arrow.DataType> | null>>();
const indexedChildVectorCache = new WeakMap<
  object,
  Map<string, IndexedArrowVector<arrow.DataType> | null>
>();

/**
 * Resolves and caches one raw Arrow child vector by column name.
 */
function getCachedRawChildVector<T extends arrow.TypeMap, P extends keyof T & string>(
  table: arrow.Table<T>,
  columnName: P
): arrow.Vector<T[P]> | null {
  let tableCache = rawChildVectorCache.get(table);
  if (!tableCache) {
    tableCache = new Map();
    rawChildVectorCache.set(table, tableCache);
  }

  if (!tableCache.has(columnName)) {
    tableCache.set(
      columnName,
      (table.getChild(columnName) as arrow.Vector<arrow.DataType> | null) ?? null
    );
  }

  return (tableCache.get(columnName) as arrow.Vector<T[P]> | null | undefined) ?? null;
}
