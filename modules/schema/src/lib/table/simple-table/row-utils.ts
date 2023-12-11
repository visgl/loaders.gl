// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Convert an object row to an array row */
export function convertToObjectRow(
  arrayRow: unknown[],
  headers: string[] | null
): {[columnName: string]: unknown} {
  if (!arrayRow) {
    throw new Error('null row');
  }
  const objectRow: {[columnName: string]: unknown} = {};
  if (headers) {
    for (let i = 0; i < headers.length; i++) {
      objectRow[headers[i]] = arrayRow[i];
    }
  } else {
    for (let i = 0; i < arrayRow.length; i++) {
      const columnName = `column-${i}`;
      objectRow[columnName] = arrayRow[i];
    }
  }
  return objectRow;
}

/** Convert an object row to an array row */
export function convertToArrayRow(
  objectRow: {[columnName: string]: unknown},
  headers: string[] | null
): unknown[] {
  if (!objectRow) {
    throw new Error('null row');
  }

  if (headers) {
    const arrayRow = new Array(headers.length);
    for (let i = 0; i < headers.length; i++) {
      arrayRow[i] = objectRow[headers[i]];
    }
    return arrayRow;
  }
  return Object.values(objectRow);
}

/** Get headers from a sample array row */
export function inferHeadersFromArrayRow(arrayRow: unknown[]) {
  const headers: string[] = [];
  for (let i = 0; i < arrayRow.length; i++) {
    const columnName = `column-${i}`;
    headers.push(columnName);
  }
  return headers;
}

/** Get headers from a smaple object row */
export function inferHeadersFromObjectRow(row: {[columnName: string]: unknown}) {
  return Object.keys(row);
}
