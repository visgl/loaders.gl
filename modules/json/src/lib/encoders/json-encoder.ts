// loaders.gl, MIT license
// Copyright 2022 Foursquare Labs, Inc.

import {Table, makeRowIterator} from '@loaders.gl/schema';

type RowArray = unknown[];
type RowObject = {[key: string]: unknown};
type TableJSON = RowArray[] | RowObject[];

export type JSONWriterOptions = {
  shape?: 'object-row-table' | 'array-row-table';
  wrapper?: (table: TableJSON) => unknown;
};

/**
 * Encode a table as a JSON string
 */
export function encodeTableAsJSON(table: Table, options: JSONWriterOptions = {}): string {
  const shape = options.shape || 'object-row-table';

  const strings: string[] = [];
  const rowIterator = makeRowIterator(table, shape);
  for (const row of rowIterator) {
    // Round elements etc
    // processRow(wrappedRow, table.schema);
    // const wrappedRow = options.wrapper ? options.wrapper(row) : row;
    strings.push(JSON.stringify(row));
  }
  return `[${strings.join(',')}]`;
}

