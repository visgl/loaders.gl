// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table as ApacheArrowTable} from 'apache-arrow';
import type {ArrayRowTable, ObjectRowTable, Table} from '@loaders.gl/core/schema';
import {makeTableFromData} from '@loaders.gl/core/schema-utils';
import {
  convertRowTableToArrowTable,
  type JSONArrowConversionOptions
} from './convert-row-table-to-arrow';

/**
 * Options for converting already-parsed JSON rows to a native Apache Arrow table.
 * Uses the same schema and recovery policies as JSONTableLoader, without the `json` namespace.
 */
export type ConvertJSONToArrowOptions = Pick<
  JSONArrowConversionOptions,
  'schema' | 'arrowConversion' | 'log'
>;

/**
 * Converts already-parsed JSON rows to a native Apache Arrow table synchronously.
 *
 * Accepts object-row arrays, array-row arrays, loaders.gl row tables, or a JSON object
 * containing a row array. Nested objects use the first array found in property order.
 * Does not parse text, fetch data, mutate input rows, or accumulate streaming chunks.
 *
 * @param data - Parsed JSON containing rows, or a loaders.gl row-table wrapper.
 * @param options - Optional schema, conversion recovery policies, and warning logger.
 * @returns A native Apache Arrow Table, without a loaders.gl table wrapper.
 * @throws If no row array is found or values violate the active conversion policy.
 * @example
 * const table = convertJSONToArrow([{name: 'Oslo', population: 717710}]);
 */
export function convertJSONToArrow(
  data: unknown,
  options?: ConvertJSONToArrowOptions
): ApacheArrowTable {
  const table = getJSONRowTable(data);
  if (!table) {
    throw new Error(
      'convertJSONToArrow: expected a JSON row array or an object containing a JSON row array'
    );
  }
  return convertRowTableToArrowTable(table, options).data;
}

/**
 * Returns a row table when a JSON value contains row-array data.
 *
 * @param json - Parsed JSON value.
 * @returns A loaders.gl row table, or `null` when no row array is present.
 */
export function getJSONRowTable(json: unknown): ArrayRowTable | ObjectRowTable | null {
  if (isRowTable(json)) {
    return json;
  }

  const rows = Array.isArray(json) ? json : getFirstArray(json);
  if (!rows) {
    return null;
  }

  if (rows.length === 0) {
    return {shape: 'object-row-table', schema: {fields: [], metadata: {}}, data: []};
  }

  const firstRow = rows[0];
  if (Array.isArray(firstRow)) {
    return makeTableFromData(rows as unknown[][]);
  }
  if (firstRow && typeof firstRow === 'object') {
    return makeTableFromData(rows as {[key: string]: unknown}[]);
  }

  return null;
}

/**
 * Checks whether a parsed JSON value is already a row-table wrapper.
 *
 * @param value - Parsed JSON value.
 * @returns `true` when `value` is a loaders.gl object-row or array-row table.
 */
function isRowTable(value: unknown): value is ArrayRowTable | ObjectRowTable {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'shape' in value &&
      ((value as Table).shape === 'array-row-table' ||
        (value as Table).shape === 'object-row-table')
  );
}

/**
 * Finds the first nested row array within a parsed JSON object.
 *
 * @param json - Parsed JSON value.
 * @returns The first nested array, or `null` when none exists.
 */
function getFirstArray(json: unknown): unknown[] | null {
  if (Array.isArray(json)) {
    return json;
  }
  if (json && typeof json === 'object') {
    for (const value of Object.values(json)) {
      const array = getFirstArray(value);
      if (array) {
        return array;
      }
    }
  }
  return null;
}
