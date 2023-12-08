// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright 2022 Foursquare Labs, Inc.

import {Table, makeRowIterator} from '@loaders.gl/schema';
import type {JSONWriterOptions} from '../../json-writer';

/**
 * Encode a table as a JSON string
 */
export function encodeTableAsJSON(table: Table, options?: JSONWriterOptions): string {
  const shape = options?.json?.shape || 'object-row-table';

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
