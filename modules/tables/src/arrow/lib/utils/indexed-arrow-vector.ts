// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';

import {
  getIndexedAccessRow,
  getIndexedRelativeAccessRow,
  normalizeIndexedArrowIndexes
} from './indexed-arrow-helpers';

/**
 * Readonly indexed view over one Apache Arrow vector.
 *
 * The view stores raw row indexes only. It does not copy vector values until callers iterate or call
 * `toArray()`.
 *
 * @typeParam T - Backing Arrow data type.
 */
export class IndexedArrowVector<T extends arrow.DataType> {
  /** Backing Arrow vector in raw row order. */
  readonly vector: arrow.Vector<T>;
  /** Raw row indexes exposed by this indexed view. */
  readonly indexes: Int32Array;

  /**
   * Builds one indexed Arrow vector view.
   *
   * @param vector - Backing Arrow vector in raw row order.
   * @param indexes - Raw vector indexes to expose through this view.
   */
  constructor(vector: arrow.Vector<T>, indexes: readonly number[] | Int32Array) {
    this.vector = vector;
    this.indexes = normalizeIndexedArrowIndexes(indexes, vector.length);
  }

  /**
   * Number of visible values exposed through this indexed vector.
   *
   * @returns Count of visible values in the indexed view.
   */
  get length(): number {
    return this.indexes.length;
  }

  /**
   * Resolves one value by view-local row index.
   *
   * @param rowIndex - Visible row index within this indexed vector.
   * @returns Value at the requested visible row index, or `null` when the index is invalid.
   */
  get(rowIndex: number): T['TValue'] | null {
    const rawIndex = getIndexedAccessRow(this.indexes, rowIndex);
    return rawIndex === null ? null : this.vector.get(rawIndex);
  }

  /**
   * Resolves one value by relative view-local row index.
   *
   * @param rowIndex - Relative visible row index using `Array.prototype.at` semantics.
   * @returns Value at the resolved visible row index, or `null` when the index is invalid.
   */
  at(rowIndex: number): T['TValue'] | null {
    const normalizedIndex = getIndexedRelativeAccessRow(this.length, rowIndex);
    return normalizedIndex === null ? null : this.get(normalizedIndex);
  }

  /**
   * Returns one sliced indexed view over the same backing Arrow vector.
   *
   * @param begin - Optional inclusive visible-row start index.
   * @param end - Optional exclusive visible-row end index.
   * @returns New indexed vector view over the sliced visible values.
   */
  slice(begin?: number, end?: number): IndexedArrowVector<T> {
    return new IndexedArrowVector(this.vector, this.indexes.slice(begin, end));
  }

  /**
   * Materializes the visible indexed values into a JavaScript array.
   *
   * @returns Array of visible values in indexed row order.
   */
  toArray(): Array<T['TValue'] | null> {
    return Array.from(this);
  }

  /**
   * Iterates over visible values in indexed row order.
   *
   * @returns Iterator over visible values in indexed row order.
   */
  *[Symbol.iterator](): IterableIterator<T['TValue'] | null> {
    for (let rowIndex = 0; rowIndex < this.length; rowIndex++) {
      yield this.get(rowIndex);
    }
  }
}
