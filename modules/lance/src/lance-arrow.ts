// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {ArrowTable} from '@loaders.gl/schema';

import {parseLanceColumnMetadata, parseLanceFileMetadata} from './lance-file';
import {
  decodeLanceFlatColumn,
  decodeLanceFlatPage,
  type LanceFlatPrimitiveArray,
  type LanceFlatPrimitiveType
} from './lance-decoder';

/** Options for converting a flat Lance data file to an Arrow table. */
export type LanceArrowReadOptions = Readonly<{
  /** Primitive type for each physical Lance column. */
  columnTypes: LanceFlatPrimitiveType[];
  /** Optional output names for physical columns. */
  columnNames?: string[];
}>;

/** A selected physical column for a ranged remote Lance read. */
export type LanceRemoteColumnRead = Readonly<{
  /** Physical column index in the Lance data file. */
  index: number;
  /** Arrow output column name. */
  name: string;
  /** Fixed-width primitive type stored by the column. */
  type: LanceFlatPrimitiveType;
}>;

/** A two-dimensional fixed-size float list used as a coordinate pair. */
export type LanceRemoteCoordinateRead = Readonly<{
  /** Physical column index in the Lance data file. */
  index: number;
  /** Output name for the first coordinate. */
  xName: string;
  /** Output name for the second coordinate. */
  yName: string;
}>;

/** Decodes a flat primitive Lance data file into an Arrow table. */
export function parseLanceFileToArrow(
  arrayBuffer: ArrayBuffer | ArrayBufferView,
  options: LanceArrowReadOptions
): ArrowTable {
  const metadata = parseLanceFileMetadata(arrayBuffer);
  if (options.columnTypes.length !== metadata.numColumns) {
    throw new Error(
      `Lance column type count ${options.columnTypes.length} does not match file column count ${metadata.numColumns}`
    );
  }
  if (options.columnNames && options.columnNames.length !== metadata.numColumns) {
    throw new Error(
      `Lance column name count ${options.columnNames.length} does not match file column count ${metadata.numColumns}`
    );
  }

  const columns: Record<string, LanceFlatPrimitiveArray> = {};
  for (let columnIndex = 0; columnIndex < metadata.numColumns; columnIndex++) {
    const columnName = options.columnNames?.[columnIndex] ?? `column${columnIndex}`;
    columns[columnName] = decodeLanceFlatColumn(
      arrayBuffer,
      metadata.columns[columnIndex],
      options.columnTypes[columnIndex]
    );
  }
  return {shape: 'arrow-table', data: arrow.tableFromArrays(columns)};
}

async function fetchLanceRange(url: string, start: number, end: number): Promise<Uint8Array> {
  const response = await fetch(url, {headers: {Range: `bytes=${start}-${end}`}});
  if (!response.ok)
    throw new Error(`Failed to read Lance byte range ${start}-${end}: ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength !== end - start + 1) {
    throw new Error(
      `Lance range response returned ${bytes.byteLength} bytes; expected ${end - start + 1}`
    );
  }
  return bytes;
}

/** Reads two-dimensional fixed-size float coordinate columns from a remote Lance file. */
export async function readLanceRemoteCoordinatesToArrow(
  url: string,
  fileSizeBytes: number,
  columns: readonly LanceRemoteCoordinateRead[],
  limit?: number,
  offset = 0
): Promise<ArrowTable> {
  if (!Number.isSafeInteger(offset) || offset < 0)
    throw new Error(`Invalid Lance coordinate offset ${offset}`);
  if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 0))
    throw new Error(`Invalid Lance coordinate limit ${limit}`);
  const footer = await fetchLanceRange(url, fileSizeBytes - 40, fileSizeBytes - 1);
  const footerView = new DataView(footer.buffer, footer.byteOffset, footer.byteLength);
  if (new TextDecoder().decode(footer.slice(36, 40)) !== 'LANC')
    throw new Error('Invalid Lance remote file footer');
  const columnOffsetTable = Number(footerView.getBigUint64(8, true));
  const numColumns = footerView.getUint32(28, true);
  const columnTable = await fetchLanceRange(
    url,
    columnOffsetTable,
    columnOffsetTable + numColumns * 16 - 1
  );
  const columnTableView = new DataView(
    columnTable.buffer,
    columnTable.byteOffset,
    columnTable.byteLength
  );
  const values: Record<string, Float32Array> = {};

  for (const column of columns) {
    if (!Number.isInteger(column.index) || column.index < 0 || column.index >= numColumns)
      throw new Error(`Invalid Lance coordinate column index ${column.index}`);
    const entryOffset = column.index * 16;
    const metadataOffset = Number(columnTableView.getBigUint64(entryOffset, true));
    const metadataSize = Number(columnTableView.getBigUint64(entryOffset + 8, true));
    const descriptor = parseLanceColumnMetadata(
      await fetchLanceRange(url, metadataOffset, metadataOffset + metadataSize - 1)
    );
    const pages = [...descriptor.pages].sort(
      (firstPage, secondPage) => firstPage.priority - secondPage.priority
    );
    const xChunks: Float32Array[] = [];
    const yChunks: Float32Array[] = [];
    let remaining = limit ?? Number.MAX_SAFE_INTEGER;
    let rowsToSkip = offset;
    for (const page of pages) {
      if (remaining <= 0) break;
      if (rowsToSkip >= page.length) {
        rowsToSkip -= page.length;
        continue;
      }
      if (page.bufferOffsets.length !== 2 || page.bufferSizes.length !== 2)
        throw new Error(`Lance coordinate column ${column.index} has an unsupported page layout`);
      const valueBytes = await fetchLanceRange(
        url,
        page.bufferOffsets[1],
        page.bufferOffsets[1] + page.bufferSizes[1] - 1
      );
      const valueByteOffset = 8;
      const valueByteLength = page.length * 2 * 4;
      if (valueBytes.byteLength < valueByteOffset + valueByteLength)
        throw new Error(`Lance coordinate page ${column.index} has an invalid float buffer size`);
      const pageValues = new Float32Array(page.length * 2);
      const valueView = new DataView(
        valueBytes.buffer,
        valueBytes.byteOffset + valueByteOffset,
        valueByteLength
      );
      for (let index = 0; index < pageValues.length; index++)
        pageValues[index] = valueView.getFloat32(index * 4, true);
      const pageStart = rowsToSkip;
      const pageEnd = Math.min(page.length, pageStart + remaining);
      const xValues = new Float32Array(pageEnd - pageStart);
      const yValues = new Float32Array(pageEnd - pageStart);
      for (let index = pageStart; index < pageEnd; index++) {
        xValues[index - pageStart] = pageValues[index * 2];
        yValues[index - pageStart] = pageValues[index * 2 + 1];
      }
      xChunks.push(xValues);
      yChunks.push(yValues);
      remaining -= pageEnd - pageStart;
      rowsToSkip = 0;
    }
    const mergeChunks = (chunks: Float32Array[]): Float32Array => {
      const merged = new Float32Array(chunks.reduce((length, chunk) => length + chunk.length, 0));
      let mergedOffset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, mergedOffset);
        mergedOffset += chunk.length;
      }
      return merged;
    };
    values[column.xName] = mergeChunks(xChunks);
    values[column.yName] = mergeChunks(yChunks);
  }
  return {shape: 'arrow-table', data: arrow.tableFromArrays(values)};
}

/** Reads selected flat primitive columns from a remote Lance file with HTTP ranges. */
export async function readLanceRemoteFileToArrow(
  url: string,
  fileSizeBytes: number,
  columns: readonly LanceRemoteColumnRead[],
  limit?: number,
  offset = 0
): Promise<ArrowTable> {
  if (!Number.isSafeInteger(offset) || offset < 0) {
    throw new Error(`Invalid Lance remote row offset ${offset}`);
  }
  if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 0)) {
    throw new Error(`Invalid Lance remote row limit ${limit}`);
  }
  const footer = await fetchLanceRange(url, fileSizeBytes - 40, fileSizeBytes - 1);
  const footerView = new DataView(footer.buffer, footer.byteOffset, footer.byteLength);
  if (new TextDecoder().decode(footer.slice(36, 40)) !== 'LANC') {
    throw new Error('Invalid Lance remote file footer');
  }
  const columnOffsetTable = Number(footerView.getBigUint64(8, true));
  const numColumns = footerView.getUint32(28, true);
  const columnTable = await fetchLanceRange(
    url,
    columnOffsetTable,
    columnOffsetTable + numColumns * 16 - 1
  );
  const columnTableView = new DataView(
    columnTable.buffer,
    columnTable.byteOffset,
    columnTable.byteLength
  );
  const values: Record<string, LanceFlatPrimitiveArray> = {};

  for (const column of columns) {
    if (!Number.isInteger(column.index) || column.index < 0 || column.index >= numColumns) {
      throw new Error(`Invalid Lance remote column index ${column.index}`);
    }
    const entryOffset = column.index * 16;
    const metadataOffset = Number(columnTableView.getBigUint64(entryOffset, true));
    const metadataSize = Number(columnTableView.getBigUint64(entryOffset + 8, true));
    const descriptor = parseLanceColumnMetadata(
      await fetchLanceRange(url, metadataOffset, metadataOffset + metadataSize - 1)
    );
    const pages = [...descriptor.pages].sort(
      (firstPage, secondPage) => firstPage.priority - secondPage.priority
    );
    const chunks: LanceFlatPrimitiveArray[] = [];
    let remaining = limit ?? Number.MAX_SAFE_INTEGER;
    let rowsToSkip = offset;
    for (const page of pages) {
      if (remaining <= 0) break;
      if (rowsToSkip >= page.length) {
        rowsToSkip -= page.length;
        continue;
      }
      if (page.bufferOffsets.length !== 1 || page.bufferSizes.length !== 1) {
        throw new Error(`Lance remote column ${column.name} has a non-flat page`);
      }
      const pageBytes = await fetchLanceRange(
        url,
        page.bufferOffsets[0],
        page.bufferOffsets[0] + page.bufferSizes[0] - 1
      );
      const decodedPage = decodeLanceFlatPage(
        pageBytes,
        {...page, bufferOffsets: [0]},
        column.type
      );
      const pageStart = rowsToSkip;
      const pageEnd = Math.min(page.length, pageStart + remaining);
      chunks.push(decodedPage.slice(pageStart, pageEnd) as LanceFlatPrimitiveArray);
      remaining -= pageEnd - pageStart;
      rowsToSkip = 0;
    }
    const totalLength = chunks.reduce((length, chunk) => length + chunk.length, 0);
    const ArrayConstructor = chunks[0]?.constructor as {
      new (length: number): LanceFlatPrimitiveArray;
    };
    const merged = new ArrayConstructor(totalLength);
    let mergedOffset = 0;
    for (const chunk of chunks) {
      if (column.type === 'int64') {
        (merged as BigInt64Array).set(chunk as BigInt64Array, mergedOffset);
      } else if (column.type === 'uint64') {
        (merged as BigUint64Array).set(chunk as BigUint64Array, mergedOffset);
      } else {
        (merged as Int8Array).set(chunk as Int8Array, mergedOffset);
      }
      mergedOffset += chunk.length;
    }
    values[column.name] = merged;
  }
  return {shape: 'arrow-table', data: arrow.tableFromArrays(values)};
}
