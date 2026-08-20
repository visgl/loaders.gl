// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ParquetColumnChunk, ParquetField} from '../schema/declare';

/** One row-aligned slice of a shredded column prepared for page encoding. */
export interface PlannedParquetPage {
  /** Shredded levels and non-null values contained in this page. */
  readonly data: ParquetColumnChunk;
  /** Number of top-level rows represented by the page. */
  readonly rowCount: number;
}

/** Splits a shredded column into target-sized pages without splitting a top-level row. */
export function planColumnPages(
  column: ParquetField,
  data: ParquetColumnChunk,
  rowCount: number,
  pageSize: number
): PlannedParquetPage[] {
  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    throw new Error(`Parquet page size must be a positive integer, received ${pageSize}`);
  }
  if (data.rlevels.length < data.count || data.dlevels.length < data.count) {
    throw new Error(`Invalid shredded column ${column.key}: level buffers are shorter than count`);
  }
  if (rowCount === 0) {
    return [];
  }

  const rowStarts = [0];
  for (let levelIndex = 1; levelIndex < data.count; levelIndex++) {
    if (data.rlevels[levelIndex] === 0) {
      rowStarts.push(levelIndex);
    }
  }
  rowStarts.push(data.count);
  if (rowStarts.length !== rowCount + 1) {
    throw new Error(
      `Invalid shredded column ${column.key}: found ${rowStarts.length - 1} rows, expected ${rowCount}`
    );
  }

  const pages: PlannedParquetPage[] = [];
  let pageStartRow = 0;
  let valueStart = 0;
  while (pageStartRow < rowCount) {
    const levelStart = rowStarts[pageStartRow];
    let pageEndRow = pageStartRow + 1;
    while (pageEndRow < rowCount && rowStarts[pageEndRow + 1] - levelStart <= pageSize) {
      pageEndRow++;
    }

    const levelEnd = rowStarts[pageEndRow];
    let valueCount = 0;
    for (let levelIndex = levelStart; levelIndex < levelEnd; levelIndex++) {
      if (data.dlevels[levelIndex] === column.dLevelMax) {
        valueCount++;
      }
    }
    const valueEnd = valueStart + valueCount;
    pages.push({
      rowCount: pageEndRow - pageStartRow,
      data: {
        rlevels: data.rlevels.slice(levelStart, levelEnd),
        dlevels: data.dlevels.slice(levelStart, levelEnd),
        values: data.values.slice(valueStart, valueEnd),
        count: levelEnd - levelStart,
        pageHeaders: []
      }
    });
    pageStartRow = pageEndRow;
    valueStart = valueEnd;
  }

  if (valueStart !== data.values.length) {
    throw new Error(
      `Invalid shredded column ${column.key}: consumed ${valueStart} values, expected ${data.values.length}`
    );
  }
  return pages;
}
