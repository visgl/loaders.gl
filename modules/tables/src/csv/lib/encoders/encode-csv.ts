// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright 2022 Foursquare Labs, Inc.

import {isNativeWriterTable, type TableWriterInput} from '../../../arrow/table-writer-input';
import {
  makeArrayRowIterator,
  getTableNumCols,
  convertArrowToSchema
} from '@loaders.gl/core/schema-utils';
import {DataType, type Vector, type Timestamp} from 'apache-arrow';
import {formatArrowTimestamps} from './format-arrow-timestamps';
import type {CSVWriterOptions} from '../../csv-writer-types';

type EncodableData = string | null;

/**
 * Encode a Table object as CSV
 */
export function encodeTableAsCSV(
  table: TableWriterInput,
  options: CSVWriterOptions = {csv: {useDisplayNames: true}}
): string {
  const useDisplayNames = options.useDisplayNames || options.csv?.useDisplayNames;

  const native = isNativeWriterTable(table);
  const fields = (native ? convertArrowToSchema(table.schema) : table.schema)?.fields || [];
  const columnCount = native ? table.numCols : getTableNumCols(table);

  const columnNames = fields.map(f => {
    // This is a leaky abstraction, assuming Kepler metadata
    const displayName = f.metadata?.displayName;
    return useDisplayNames && typeof displayName === 'string' ? displayName : f.name;
  });
  const formattedData: EncodableData[][] = [columnNames];
  // Native row access converts timestamp integers to numbers, losing nanosecond
  // precision. Iterate timestamp storage only when ISO formatting is requested.
  const timestampColumns =
    native && options.csv?.timestampFormat === 'iso'
      ? Array.from({length: columnCount}, (_, index) => {
          const column = table.getChildAt(index);
          return column && DataType.isTimestamp(column.type)
            ? formatArrowTimestamps(column as Vector<Timestamp>)
            : undefined;
        })
      : [];

  if (native) {
    const columns = Array.from({length: columnCount}, (_, index) => table.getChildAt(index));
    for (let rowIndex = 0; rowIndex < table.numRows; rowIndex++) {
      formattedData.push(
        columns.map((column, columnIndex) => {
          const timestamp = timestampColumns[columnIndex];
          return timestamp
            ? (timestamp.next().value ?? null)
            : preformatFieldValue(column?.get(rowIndex));
        })
      );
    }
  } else {
    for (const row of makeArrayRowIterator(table)) {
      formattedData.push(
        Array.from({length: columnCount}, (_, columnIndex) => preformatFieldValue(row[columnIndex]))
      );
    }
  }

  // We represent missing values as '', leaving the option for the app to explicity represent 'null'.
  const stringsOnly = formattedData.map(row => row.map(value => (value === null ? '' : value)));

  return stringsOnly.map(row => row.map(formatCSVField).join(',')).join('\n');
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

/** Quotes a preformatted CSV field when it contains a delimiter, quote, or line break. */
function formatCSVField(value: string): string {
  return /[",\r\n]/.test(value) ? '"' + value.replace(/"/g, '""') + '"' : value;
}
