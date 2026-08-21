// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ReadableFile} from '@loaders.gl/loader-utils';

import type {
  ParquetComparisonPredicate,
  ParquetInPredicate,
  ParquetNullPredicate,
  ParquetPredicate
} from '../parquet-source-types';
import {
  ColumnIndex,
  Encoding,
  OffsetIndex,
  type ColumnChunk,
  type RowGroup
} from '../parquetjs/parquet-thrift/index';
import type {ParquetField} from '../parquetjs/schema/declare';
import type {ParquetSchema} from '../parquetjs/schema/schema';
import * as Types from '../parquetjs/schema/types';
import {
  copyUint8Array,
  readDoubleLE,
  readFloatLE,
  readInt32LE,
  readInt64LE,
  readUInt32LE,
  readUInt64LE,
  toUint8Array
} from '../parquetjs/utils/binary-utils';
import {Uint8ArrayCompactProtocol} from '../parquetjs/utils/uint8-array-compact-protocol';
import {Uint8ArrayTransport} from '../parquetjs/utils/uint8-array-transport';
import {
  canParquetStatisticsMatch,
  getParquetPredicatePath,
  getParquetPredicatePaths
} from './parquet-predicate';

/** Half-open logical row range relative to one Parquet row group. */
export type ParquetRowRange = {
  /** First included row. */
  start: number;
  /** First excluded row. */
  end: number;
};

/** One data-page location decoded from a Parquet offset index. */
export type ParquetDataPageLocation = {
  /** Absolute page-header offset in the source object. */
  offset: number;
  /** Page header plus compressed body byte length. */
  compressedByteLength: number;
  /** First logical row represented by the page. */
  firstRowIndex: number;
  /** First logical row represented by the next page. */
  endRowIndex: number;
};

/** Page locations keyed by the physical Parquet column path. */
export type ParquetPageLocations = Record<string, ParquetDataPageLocation[]>;

/** Selective page plan for one row group. */
export type ParquetPagePruningPlan = {
  /** Candidate row ranges after conservative page-statistics pruning. */
  rowRanges: ParquetRowRange[];
  /** Offset-index page locations for every decoded column. */
  pageLocations: ParquetPageLocations;
  /** Number of column and offset index blobs decoded. */
  indexCount: number;
  /** Data pages in all decoded column chunks. */
  totalPageCount: number;
  /** Data pages required by the candidate ranges. */
  selectedPageCount: number;
  /** Logical rows eliminated before data-page reads. */
  prunedRowCount: number;
};

type ParquetPageStatistics = {
  min?: unknown;
  max?: unknown;
  nullCount?: number;
  minIsExact?: boolean;
  maxIsExact?: boolean;
};

type ParquetColumnPageStatistics = {
  pages: ParquetDataPageLocation[];
  statistics: ParquetPageStatistics[];
};

/**
 * Builds a conservative selective-page plan from Parquet column and offset indexes.
 *
 * Returns `undefined` when indexes or the current non-repeated-column decoder cannot safely avoid full
 * column-chunk reads. An empty `rowRanges` array means the indexes prove the predicate cannot match.
 */
export async function createParquetPagePruningPlan(
  file: ReadableFile,
  rowGroup: RowGroup,
  schema: ParquetSchema,
  selectedColumnPaths: readonly string[][],
  predicate: ParquetPredicate,
  signal?: AbortSignal
): Promise<ParquetPagePruningPlan | undefined> {
  const rowCount = Number(rowGroup.num_rows);
  const selectedColumnChunks = getSelectedColumnChunks(rowGroup, selectedColumnPaths);
  if (!isSafePageSelection(schema, selectedColumnChunks) || rowCount <= 0) {
    return undefined;
  }

  const pageLocations: ParquetPageLocations = {};
  const pageStatistics: Record<string, ParquetColumnPageStatistics> = {};
  const predicatePaths = new Set(
    getParquetPredicatePaths(predicate).map(path => JSON.stringify(path))
  );
  let indexCount = 0;

  await Promise.all(
    selectedColumnChunks.map(async columnChunk => {
      const path = columnChunk.meta_data!.path_in_schema;
      const pathKey = JSON.stringify(path);
      const offsetIndexRange = getParquetIndexRange(
        columnChunk.offset_index_offset,
        columnChunk.offset_index_length,
        file.size
      );
      if (!offsetIndexRange) {
        return;
      }
      const offsetIndexBytes = await file.read(
        offsetIndexRange.offset,
        offsetIndexRange.length,
        signal
      );
      let pages: ParquetDataPageLocation[];
      try {
        pages = decodeOffsetIndex(toUint8Array(offsetIndexBytes), rowCount);
      } catch {
        return;
      }
      pageLocations[pathKey] = pages;
      indexCount++;

      if (!predicatePaths.has(pathKey)) {
        return;
      }
      const columnIndexRange = getParquetIndexRange(
        columnChunk.column_index_offset,
        columnChunk.column_index_length,
        file.size
      );
      if (!columnIndexRange) {
        return;
      }
      const columnIndexBytes = await file.read(
        columnIndexRange.offset,
        columnIndexRange.length,
        signal
      );
      const field = schema.findField(path);
      try {
        pageStatistics[pathKey] = {
          pages,
          statistics: decodeColumnIndex(toUint8Array(columnIndexBytes), pages, field)
        };
      } catch {
        return;
      }
      indexCount++;
    })
  );

  if (
    selectedColumnChunks.some(
      columnChunk => !pageLocations[JSON.stringify(columnChunk.meta_data!.path_in_schema)]
    )
  ) {
    return undefined;
  }

  const candidateRanges = getPredicateRowRanges(predicate, pageStatistics, rowCount);
  if (candidateRanges === undefined) {
    return undefined;
  }
  const rowRanges = expandAndMergeRowRanges(candidateRanges, pageLocations, rowCount);
  const prunedRowCount = rowCount - getRowRangeCount(rowRanges);
  if (prunedRowCount <= 0) {
    return undefined;
  }

  const totalPageCount = Object.values(pageLocations).reduce(
    (count, pages) => count + pages.length,
    0
  );
  const selectedPageCount = Object.values(pageLocations).reduce(
    (count, pages) => count + countSelectedPages(pages, rowRanges),
    0
  );
  return {
    rowRanges,
    pageLocations,
    indexCount,
    totalPageCount,
    selectedPageCount,
    prunedRowCount
  };
}

/** Returns data-page byte ranges needed to decode a selective row-group plan. */
export function getParquetPageReadRanges(
  rowGroup: RowGroup,
  selectedColumnPaths: readonly string[][],
  plan: ParquetPagePruningPlan
): Array<{offset: number; length: number}> {
  const ranges: Array<{offset: number; length: number}> = [];
  for (const columnChunk of getSelectedColumnChunks(rowGroup, selectedColumnPaths)) {
    const columnMetadata = columnChunk.meta_data!;
    const pages = plan.pageLocations[JSON.stringify(columnMetadata.path_in_schema)];
    const selectedPages = pages.filter(page =>
      plan.rowRanges.some(range => page.endRowIndex > range.start && page.firstRowIndex < range.end)
    );
    if (!selectedPages.length) {
      continue;
    }
    const dictionaryPageOffset = Number(columnMetadata.dictionary_page_offset);
    if (Number.isSafeInteger(dictionaryPageOffset) && dictionaryPageOffset > 0) {
      ranges.push({
        offset: dictionaryPageOffset,
        length: Math.max(0, pages[0].offset - dictionaryPageOffset)
      });
    }
    for (const rowRange of plan.rowRanges) {
      const overlappingPages = pages.filter(
        page => page.endRowIndex > rowRange.start && page.firstRowIndex < rowRange.end
      );
      if (!overlappingPages.length) {
        continue;
      }
      const firstPage = overlappingPages[0];
      const lastPage = overlappingPages[overlappingPages.length - 1];
      ranges.push({
        offset: firstPage.offset,
        length: lastPage.offset + lastPage.compressedByteLength - firstPage.offset
      });
    }
  }
  return mergeByteRanges(ranges.filter(range => range.length > 0));
}

/** Decodes one compact-protocol Parquet offset index. */
export function decodeOffsetIndex(bytes: Uint8Array, rowCount: number): ParquetDataPageLocation[] {
  const protocol = new Uint8ArrayCompactProtocol(new Uint8ArrayTransport(bytes));
  const offsetIndex = OffsetIndex.read(protocol as any);
  if (
    offsetIndex.page_locations.length === 0 ||
    Number(offsetIndex.page_locations[0].first_row_index) !== 0
  ) {
    throw new Error('Invalid Parquet offset index page locations');
  }
  return offsetIndex.page_locations.map((location, index, locations) => {
    const firstRowIndex = Number(location.first_row_index);
    const endRowIndex =
      index + 1 < locations.length ? Number(locations[index + 1].first_row_index) : rowCount;
    const offset = Number(location.offset);
    const compressedByteLength = location.compressed_page_size;
    if (
      !Number.isSafeInteger(offset) ||
      !Number.isSafeInteger(compressedByteLength) ||
      !Number.isSafeInteger(firstRowIndex) ||
      !Number.isSafeInteger(endRowIndex) ||
      offset < 0 ||
      compressedByteLength <= 0 ||
      firstRowIndex < 0 ||
      endRowIndex <= firstRowIndex ||
      endRowIndex > rowCount
    ) {
      throw new Error('Invalid Parquet offset index page location');
    }
    return {offset, compressedByteLength, firstRowIndex, endRowIndex};
  });
}

/** Returns whether one predicate leaf can match supplied page statistics. */
function getPredicateRowRanges(
  predicate: ParquetPredicate,
  columns: Record<string, ParquetColumnPageStatistics>,
  rowCount: number
): ParquetRowRange[] | undefined {
  if (predicate.op === 'and' || predicate.op === 'or') {
    if (predicate.op === 'and') {
      let ranges: ParquetRowRange[] | undefined;
      for (const child of predicate.args) {
        ranges = intersectRowRanges(ranges, getPredicateRowRanges(child, columns, rowCount));
      }
      return ranges;
    }
    let ranges: ParquetRowRange[] = [];
    for (const child of predicate.args) {
      const childRanges = getPredicateRowRanges(child, columns, rowCount);
      if (childRanges === undefined) {
        return undefined;
      }
      ranges = unionRowRanges(ranges, childRanges);
    }
    return ranges;
  }
  if (predicate.op === 'not') {
    return undefined;
  }

  const leafPredicate = predicate as
    | ParquetComparisonPredicate
    | ParquetInPredicate
    | ParquetNullPredicate;
  const column = columns[JSON.stringify(getParquetPredicatePath(leafPredicate.args[0]))];
  if (!column) {
    return undefined;
  }
  const ranges: ParquetRowRange[] = [];
  for (let pageIndex = 0; pageIndex < column.pages.length; pageIndex++) {
    const page = column.pages[pageIndex];
    if (
      canParquetStatisticsMatch(
        leafPredicate,
        column.statistics[pageIndex],
        page.endRowIndex - page.firstRowIndex
      )
    ) {
      ranges.push({start: page.firstRowIndex, end: page.endRowIndex});
    }
  }
  return mergeRowRanges(ranges);
}

/** Decodes column-index values into the logical representation used by exact predicates. */
function decodeColumnIndex(
  bytes: Uint8Array,
  pages: readonly ParquetDataPageLocation[],
  field: ParquetField
): ParquetPageStatistics[] {
  const protocol = new Uint8ArrayCompactProtocol(new Uint8ArrayTransport(bytes));
  const columnIndex = ColumnIndex.read(protocol as any);
  if (
    columnIndex.null_pages.length !== pages.length ||
    columnIndex.min_values.length !== pages.length ||
    columnIndex.max_values.length !== pages.length ||
    (columnIndex.null_counts !== undefined && columnIndex.null_counts.length !== pages.length)
  ) {
    throw new Error('Parquet column and offset indexes contain different page counts');
  }
  return pages.map((_page, pageIndex) => ({
    min: columnIndex.null_pages[pageIndex]
      ? undefined
      : decodeParquetPageStatisticsValue(columnIndex.min_values[pageIndex], field),
    max: columnIndex.null_pages[pageIndex]
      ? undefined
      : decodeParquetPageStatisticsValue(columnIndex.max_values[pageIndex], field),
    nullCount:
      columnIndex.null_counts?.[pageIndex] !== undefined
        ? Number(columnIndex.null_counts[pageIndex])
        : columnIndex.null_pages[pageIndex]
          ? pages[pageIndex].endRowIndex - pages[pageIndex].firstRowIndex
          : undefined,
    minIsExact: true,
    maxIsExact: true
  }));
}

/** Decodes one physical page-index statistic and applies its Parquet logical annotation. */
export function decodeParquetPageStatisticsValue(bytes: Uint8Array, field: ParquetField): unknown {
  let primitiveValue: unknown;
  switch (field.primitiveType) {
    case 'BOOLEAN':
      primitiveValue = Boolean(bytes[0]);
      break;
    case 'INT32':
      primitiveValue =
        field.originalType === 'UINT_32' ? readUInt32LE(bytes, 0) : readInt32LE(bytes, 0);
      break;
    case 'INT64':
      primitiveValue =
        field.originalType === 'UINT_64' ? readUInt64LE(bytes, 0) : readInt64LE(bytes, 0);
      break;
    case 'FLOAT':
      primitiveValue = readFloatLE(bytes, 0);
      break;
    case 'DOUBLE':
      primitiveValue = readDoubleLE(bytes, 0);
      break;
    case 'INT96':
    case 'BYTE_ARRAY':
    case 'FIXED_LEN_BYTE_ARRAY':
      primitiveValue = copyUint8Array(bytes);
      break;
    default:
      return undefined;
  }
  return Types.fromPrimitive(field.originalType || field.primitiveType, primitiveValue, field);
}

/** Returns selected physical chunks, using an empty path list as the all-column sentinel. */
function getSelectedColumnChunks(
  rowGroup: RowGroup,
  selectedColumnPaths: readonly string[][]
): ColumnChunk[] {
  return rowGroup.columns.filter(columnChunk => {
    const path = columnChunk.meta_data?.path_in_schema;
    return Boolean(
      path &&
        (selectedColumnPaths.length === 0 ||
          selectedColumnPaths.some(selectedPath => selectedPath[0] === path[0]))
    );
  });
}

/** Restricts selective page reads to independently materializable non-repeated leaf columns. */
function isSafePageSelection(schema: ParquetSchema, columnChunks: readonly ColumnChunk[]): boolean {
  return (
    columnChunks.length > 0 &&
    columnChunks.every(columnChunk => {
      const path = columnChunk.meta_data?.path_in_schema;
      if (!path) {
        return false;
      }
      const field = schema.findField(path);
      const dictionaryEncoded = columnChunk.meta_data!.encodings.some(
        encoding => encoding === Encoding.PLAIN_DICTIONARY || encoding === Encoding.RLE_DICTIONARY
      );
      const dictionaryPageOffset = Number(columnChunk.meta_data!.dictionary_page_offset);
      return (
        field.repetitionType !== 'REPEATED' &&
        field.rLevelMax === 0 &&
        (!dictionaryEncoded ||
          (Number.isSafeInteger(dictionaryPageOffset) && dictionaryPageOffset > 0))
      );
    })
  );
}

/** Validates one optional footer index byte range against the containing file. */
export function getParquetIndexRange(
  offsetValue: ColumnChunk['offset_index_offset'],
  lengthValue: number | undefined,
  fileSize: number
): {offset: number; length: number} | undefined {
  if (offsetValue === undefined || lengthValue === undefined) {
    return undefined;
  }
  const offset = Number(offsetValue);
  if (
    !Number.isSafeInteger(offset) ||
    !Number.isSafeInteger(lengthValue) ||
    !Number.isSafeInteger(fileSize) ||
    offset < 0 ||
    lengthValue <= 0 ||
    fileSize < 0 ||
    offset > fileSize - lengthValue
  ) {
    return undefined;
  }
  return {offset, length: lengthValue};
}

/** Expands ranges to selected-column page boundaries until all columns agree, then merges them. */
function expandAndMergeRowRanges(
  ranges: readonly ParquetRowRange[],
  pageLocations: ParquetPageLocations,
  rowCount: number
): ParquetRowRange[] {
  const pagesByColumn = Object.values(pageLocations);
  const expanded = ranges.map(range => {
    let current = {...range};
    let changed = true;
    while (changed) {
      changed = false;
      for (const pages of pagesByColumn) {
        const overlapping = pages.filter(
          page => page.endRowIndex > current.start && page.firstRowIndex < current.end
        );
        if (!overlapping.length) {
          continue;
        }
        const start = Math.min(current.start, overlapping[0].firstRowIndex);
        const end = Math.max(current.end, overlapping[overlapping.length - 1].endRowIndex);
        if (start !== current.start || end !== current.end) {
          current = {start, end};
          changed = true;
        }
      }
    }
    return {start: Math.max(0, current.start), end: Math.min(rowCount, current.end)};
  });
  return mergeRowRanges(expanded);
}

/** Intersects sorted row ranges; `undefined` represents every row. */
function intersectRowRanges(
  left: ParquetRowRange[] | undefined,
  right: ParquetRowRange[] | undefined
): ParquetRowRange[] | undefined {
  if (left === undefined) {
    return right;
  }
  if (right === undefined) {
    return left;
  }
  const ranges: ParquetRowRange[] = [];
  let leftIndex = 0;
  let rightIndex = 0;
  while (leftIndex < left.length && rightIndex < right.length) {
    const start = Math.max(left[leftIndex].start, right[rightIndex].start);
    const end = Math.min(left[leftIndex].end, right[rightIndex].end);
    if (start < end) {
      ranges.push({start, end});
    }
    if (left[leftIndex].end < right[rightIndex].end) {
      leftIndex++;
    } else {
      rightIndex++;
    }
  }
  return ranges;
}

/** Unions two sorted row-range sets. */
function unionRowRanges(
  left: readonly ParquetRowRange[],
  right: readonly ParquetRowRange[]
): ParquetRowRange[] {
  return mergeRowRanges([...left, ...right]);
}

/** Sorts and merges overlapping or touching logical row ranges. */
function mergeRowRanges(ranges: readonly ParquetRowRange[]): ParquetRowRange[] {
  const sorted = [...ranges].sort(
    (left, right) => left.start - right.start || left.end - right.end
  );
  const merged: ParquetRowRange[] = [];
  for (const range of sorted) {
    const previous = merged[merged.length - 1];
    if (previous && range.start <= previous.end) {
      previous.end = Math.max(previous.end, range.end);
    } else {
      merged.push({...range});
    }
  }
  return merged;
}

/** Counts logical rows represented by disjoint ranges. */
function getRowRangeCount(ranges: readonly ParquetRowRange[]): number {
  return ranges.reduce((count, range) => count + range.end - range.start, 0);
}

/** Counts unique pages overlapping at least one selected row range. */
function countSelectedPages(
  pages: readonly ParquetDataPageLocation[],
  ranges: readonly ParquetRowRange[]
): number {
  return pages.filter(page =>
    ranges.some(range => page.endRowIndex > range.start && page.firstRowIndex < range.end)
  ).length;
}

/** Sorts and merges overlapping or touching byte ranges without overfetch gaps. */
function mergeByteRanges(
  ranges: readonly {offset: number; length: number}[]
): Array<{offset: number; length: number}> {
  const sorted = [...ranges].sort((left, right) => left.offset - right.offset);
  const merged: Array<{offset: number; length: number}> = [];
  for (const range of sorted) {
    const previous = merged[merged.length - 1];
    const end = range.offset + range.length;
    if (previous && range.offset <= previous.offset + previous.length) {
      previous.length = Math.max(previous.offset + previous.length, end) - previous.offset;
    } else {
      merged.push({...range});
    }
  }
  return merged;
}
