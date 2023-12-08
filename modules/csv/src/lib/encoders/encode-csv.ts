// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright 2022 Foursquare Labs, Inc.

import {Table, makeArrayRowIterator, getTableNumCols} from '@loaders.gl/schema';
import {csvFormatRows} from 'd3-dsv';
import type {CSVWriterOptions} from '../../csv-writer';

type EncodableData = string | null;

/**
 * Encode a Table object as CSV
 */
export function encodeTableAsCSV(
  table: Table,
  options: CSVWriterOptions = {csv: {useDisplayNames: true}}
): string {
  const useDisplayNames = options.useDisplayNames || options.csv?.useDisplayNames;

  const fields = table.schema?.fields || [];

  const columnNames = fields.map((f) => {
    // This is a leaky abstraction, assuming Kepler metadata
    const displayName = f.metadata?.displayName;
    return useDisplayNames && typeof displayName === 'string' ? displayName : f.name;
  });
  const formattedData: EncodableData[][] = [columnNames];

  for (const row of makeArrayRowIterator(table)) {
    const formattedRow: EncodableData[] = [];
    for (let columnIndex = 0; columnIndex < getTableNumCols(table); ++columnIndex) {
      const value = row[columnIndex];
      formattedRow[columnIndex] = preformatFieldValue(value);
    }
    formattedData.push(formattedRow);
  }

  return csvFormatRows(formattedData);
}

/**
 * Stringifies a value
 * @todo Why is it called parse?
 */
const preformatFieldValue = (value: unknown): EncodableData => {
  if (value === null || value === undefined) {
    // TODO: It would be nice to distinguish between missing values and the empty string
    // https://github.com/d3/d3-dsv/issues/84
    return null;
  }
  if (value instanceof Date) {
    // d3-dsv formats dates without timezones if they don't have time info;
    // this forces them to always use fully-qualified ISO time strings
    return value.toISOString();
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
};
