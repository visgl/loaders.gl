// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 ironSource Ltd.
// Forked from https://github.com/kbajalc/parquets under MIT license

import {ArrayType} from '@loaders.gl/schema';
import {ParquetRowGroup, ParquetColumnChunk, ParquetField, ParquetRow} from './declare';
import {ParquetSchema} from './schema';
import * as Types from './types';

export {ParquetRowGroup};

export function shredBuffer(schema: ParquetSchema): ParquetRowGroup {
  const columnData: Record<string, ParquetColumnChunk> = {};
  for (const field of schema.fieldList) {
    columnData[field.key] = {
      dlevels: [],
      rlevels: [],
      values: [],
      pageHeaders: [],
      count: 0
    };
  }
  return {rowCount: 0, columnData};
}

/**
 * 'Shred' a record into a list of <value, repetition_level, definition_level>
 * tuples per column using the Google Dremel Algorithm..
 *
 * The rowGroup argument must point to an object into which the shredded record
 * will be returned. You may re-use the rowGroup for repeated calls to this function
 * to append to an existing rowGroup, as long as the schema is unchanged.
 *
 * The format in which the shredded records will be stored in the rowGroup is as
 * follows:
 *
 *   rowGroup = {
 *     columnData: [
 *       'my_col': {
 *          dlevels: [d1, d2, .. dN],
 *          rlevels: [r1, r2, .. rN],
 *          values: [v1, v2, .. vN],
 *        }, ...
 *      ],
 *      rowCount: X,
 *   }
 */
export function shredRecord(
  schema: ParquetSchema,
  record: ParquetRow,
  rowGroup: ParquetRowGroup
): void {
  /* shred the record, this may raise an exception */
  const data = shredBuffer(schema).columnData;

  shredRecordFields(schema.fields, record, data, 0, 0);

  /* if no error during shredding, add the shredded record to the rowGroup */
  if (rowGroup.rowCount === 0) {
    rowGroup.rowCount = 1;
    rowGroup.columnData = data;
    return;
  }
  rowGroup.rowCount += 1;
  for (const field of schema.fieldList) {
    Array.prototype.push.apply(
      rowGroup.columnData[field.key].rlevels as number[],
      data[field.key].rlevels as number[]
    );
    Array.prototype.push.apply(
      rowGroup.columnData[field.key].dlevels as number[],
      data[field.key].dlevels as number[]
    );
    Array.prototype.push.apply(
      rowGroup.columnData[field.key].values as unknown[],
      data[field.key].values as unknown as unknown[]
    );
    rowGroup.columnData[field.key].count += data[field.key].count;
  }
}

// eslint-disable-next-line max-statements, complexity
function shredRecordFields(
  fields: Record<string, ParquetField>,
  record: ParquetRow,
  data: Record<string, ParquetColumnChunk>,
  rLevel: number,
  dLevel: number
) {
  for (const name in fields) {
    const field = fields[name];

    // fetch values
    let values: any[] = [];
    if (
      record &&
      field.name in record &&
      record[field.name] !== undefined &&
      record[field.name] !== null
    ) {
      const fieldValue = record[field.name];
      if (field.logicalType?.type === 'LIST') {
        // Normalize the high-level Arrow/list value to Parquet's standard
        // three-level LIST representation before descending into the wrapper.
        const listValues = Array.isArray(fieldValue) ? fieldValue : [];
        if (field.fields?.list) {
          values.push({list: listValues.map(element => ({element}))});
        } else {
          // Accept the legacy two-level LIST layout where the repeated field
          // itself owns the element leaf.
          values = listValues;
        }
      } else if (field.logicalType?.type === 'MAP') {
        // Normalize Map/object/entry-array values to the standard MAP_KEY_VALUE
        // wrapper expected by the shredding algorithm.
        const mapEntries = normalizeMapEntries(fieldValue);
        if (field.fields?.key_value) {
          values.push({key_value: mapEntries});
        } else {
          // Accept legacy map layouts whose key/value group is the repeated
          // field itself.
          values = mapEntries;
        }
      } else if (fieldValue.constructor === Array) {
        values = fieldValue;
      } else {
        values.push(fieldValue);
      }
    }
    // check values
    if (values.length === 0 && Boolean(record) && field.repetitionType === 'REQUIRED') {
      throw new Error(`missing required field: ${field.name}`);
    }
    if (values.length > 1 && field.repetitionType !== 'REPEATED') {
      throw new Error(`too many values for field: ${field.name}`);
    }

    // push null
    if (values.length === 0) {
      if (field.isNested) {
        shredRecordFields(field.fields!, null!, data, rLevel, dLevel);
      } else {
        data[field.key].count += 1;
        (data[field.key].rlevels as number[]).push(rLevel);
        (data[field.key].dlevels as number[]).push(dLevel);
      }
      continue; // eslint-disable-line no-continue
    }

    // push values
    for (let i = 0; i < values.length; i++) {
      const rlvl = i === 0 ? rLevel : field.rLevelMax;
      if (field.isNested) {
        shredRecordFields(field.fields!, values[i], data, rlvl, field.dLevelMax);
      } else {
        data[field.key].count += 1;
        (data[field.key].rlevels as number[]).push(rlvl);
        (data[field.key].dlevels as number[]).push(field.dLevelMax);
        (data[field.key].values as unknown[]).push(
          Types.toPrimitive((field.originalType || field.primitiveType)!, values[i], field)
        );
      }
    }
  }
}

/** Converts supported JavaScript map representations to Parquet map entries. */
function normalizeMapEntries(value: unknown): Array<{key: unknown; value: unknown}> {
  if (value instanceof Map) {
    return Array.from(value, ([key, mapValue]) => ({key, value: mapValue}));
  }
  if (Array.isArray(value)) {
    return value.flatMap(entry => {
      if (Array.isArray(entry) && entry.length >= 2) {
        return [{key: entry[0], value: entry[1]}];
      }
      if (entry && typeof entry === 'object') {
        return [{key: Reflect.get(entry, 'key'), value: Reflect.get(entry, 'value')}];
      }
      return [];
    });
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).map(([key, mapValue]) => ({key, value: mapValue}));
  }
  return [];
}

/**
 * 'Materialize' a list of <value, repetition_level, definition_level>
 * tuples back to nested records (objects/arrays) using the Google Dremel
 * Algorithm..
 *
 * The rowGroup argument must point to an object with the following structure (i.e.
 * the same structure that is returned by shredRecords):
 *
 *   rowGroup = {
 *     columnData: [
 *       'my_col': {
 *          dlevels: [d1, d2, .. dN],
 *          rlevels: [r1, r2, .. rN],
 *          values: [v1, v2, .. vN],
 *        }, ...
 *      ],
 *      rowCount: X,
 *   }
 */
export function materializeRows(schema: ParquetSchema, rowGroup: ParquetRowGroup): ParquetRow[] {
  const rows = new Array<ParquetRow>(rowGroup.rowCount);
  for (let i = 0; i < rowGroup.rowCount; i++) {
    rows[i] = {};
  }
  for (const key in rowGroup.columnData) {
    const columnData = rowGroup.columnData[key];
    if (columnData.count) {
      materializeColumnAsRows(schema, columnData, key, rows);
    }
  }
  return rows;
}

/** Populate record fields for one column */
// eslint-disable-next-line max-statements, complexity
function materializeColumnAsRows(
  schema: ParquetSchema,
  columnData: ParquetColumnChunk,
  key: string,
  rows: ParquetRow[]
): void {
  const field = schema.findField(key);
  const branch = schema.findFieldBranch(key);

  if (branch.length === 1 && field.repetitionType !== 'REPEATED') {
    materializeFlatColumnAsRows(field, columnData, rows);
    return;
  }

  const logicalType = field.originalType || field.primitiveType!;
  const fromPrimitive = Types.PARQUET_LOGICAL_TYPES[logicalType].fromPrimitive;

  // tslint:disable-next-line:prefer-array-literal
  const rLevels: number[] = new Array(field.rLevelMax + 1).fill(0);
  let vIndex = 0;
  for (let i = 0; i < columnData.count; i++) {
    const dLevel = columnData.dlevels[i];
    const rLevel = columnData.rlevels[i];
    rLevels[rLevel]++;
    rLevels.fill(0, rLevel + 1);

    let rIndex = 0;
    let record = rows[rLevels[rIndex++] - 1];

    // Internal nodes - Build a nested row object
    for (const step of branch) {
      if (step === field || dLevel < step.dLevelMax) {
        break;
      }

      switch (step.repetitionType) {
        case 'REPEATED':
          if (!(step.name in record)) {
            // eslint-disable max-depth
            record[step.name] = [];
          }
          const ix = rLevels[rIndex++];
          while (record[step.name].length <= ix) {
            // eslint-disable max-depth
            record[step.name].push({});
          }
          record = record[step.name][ix];
          break;

        default:
          record[step.name] = record[step.name] || {};
          record = record[step.name];
      }
    }

    // Leaf node - Add the value
    if (dLevel === field.dLevelMax) {
      const primitiveValue = columnData.values[vIndex];
      const value = fromPrimitive ? fromPrimitive(primitiveValue, field) : primitiveValue;
      vIndex++;

      switch (field.repetitionType) {
        case 'REPEATED':
          if (!(field.name in record)) {
            // eslint-disable max-depth
            record[field.name] = [];
          }
          const ix = rLevels[rIndex];
          while (record[field.name].length <= ix) {
            // eslint-disable max-depth
            record[field.name].push(null);
          }
          record[field.name][ix] = value;
          break;

        default:
          record[field.name] = value;
      }
    }
  }
}

/** Materializes a top-level required or optional primitive directly into row objects. */
function materializeFlatColumnAsRows(
  field: ParquetField,
  columnData: ParquetColumnChunk,
  rows: ParquetRow[]
): void {
  const logicalType = field.originalType || field.primitiveType!;
  const fromPrimitive = Types.PARQUET_LOGICAL_TYPES[logicalType].fromPrimitive;
  const count = Math.min(columnData.count, rows.length);
  let valueIndex = 0;

  if (field.repetitionType === 'REQUIRED' && !fromPrimitive) {
    for (let rowIndex = 0; rowIndex < count; rowIndex++) {
      rows[rowIndex][field.name] = columnData.values[rowIndex];
    }
    return;
  }

  for (let rowIndex = 0; rowIndex < count; rowIndex++) {
    if (columnData.dlevels[rowIndex] === field.dLevelMax) {
      const primitiveValue = columnData.values[valueIndex];
      rows[rowIndex][field.name] = fromPrimitive
        ? fromPrimitive(primitiveValue, field)
        : primitiveValue;
      valueIndex++;
    }
  }
}

// Columnar export

/**
 * 'Materialize' a list of <value, repetition_level, definition_level>
 * tuples back to nested records (objects/arrays) using the Google Dremel
 * Algorithm..
 *
 * The rowGroup argument must point to an object with the following structure (i.e.
 * the same structure that is returned by shredRecords):
 *
 *   rowGroup = {
 *     columnData: [
 *       'my_col': {
 *          dlevels: [d1, d2, .. dN],
 *          rlevels: [r1, r2, .. rN],
 *          values: [v1, v2, .. vN],
 *        }, ...
 *      ],
 *      rowCount: X,
 *   }
 */
export function materializeColumns(
  schema: ParquetSchema,
  rowGroup: ParquetRowGroup
): Record<string, ArrayType> {
  const columns: Record<string, ArrayType> = {};
  for (const key in rowGroup.columnData) {
    const column = materializeColumn(schema, rowGroup, key);
    if (column) {
      const columnName = schema.findFieldBranch(key)[0].name;
      columns[columnName] = columns[columnName]
        ? mergeMaterializedColumn(columns[columnName], column)
        : column;
    }
  }
  return columns;
}

/** Merges independently decoded nested leaf columns into one top-level column. */
function mergeMaterializedColumn(existing: ArrayType, incoming: ArrayType): ArrayType {
  const length = Math.max(existing.length, incoming.length);
  const merged = new Array(length);
  for (let index = 0; index < length; index++) {
    merged[index] = mergeMaterializedValue(existing[index], incoming[index]);
  }
  return merged;
}

/** Recursively combines objects and corresponding repeated elements without losing scalar leaves. */
function mergeMaterializedValue(existing: unknown, incoming: unknown): unknown {
  if (existing === null || existing === undefined) {
    return incoming;
  }
  if (incoming === null || incoming === undefined) {
    return existing;
  }
  if (Array.isArray(existing) && Array.isArray(incoming)) {
    const length = Math.max(existing.length, incoming.length);
    return Array.from({length}, (_, index) =>
      mergeMaterializedValue(existing[index], incoming[index])
    );
  }
  if (
    typeof existing === 'object' &&
    typeof incoming === 'object' &&
    !ArrayBuffer.isView(existing) &&
    !ArrayBuffer.isView(incoming)
  ) {
    const merged: Record<string, unknown> = {...(existing as Record<string, unknown>)};
    for (const [key, value] of Object.entries(incoming as Record<string, unknown>)) {
      merged[key] = mergeMaterializedValue(merged[key], value);
    }
    return merged;
  }
  return incoming;
}

/** Materializes one decoded Parquet column into its top-level columnar representation. */
export function materializeColumn(
  schema: ParquetSchema,
  rowGroup: ParquetRowGroup,
  key: string
): ArrayType | undefined {
  const columnData = rowGroup.columnData[key];
  if (!columnData?.count) {
    return undefined;
  }

  const columns: Record<string, ArrayType> = {};
  materializeColumnAsColumnarArray(schema, columnData, rowGroup.rowCount, key, columns);
  return columns[schema.findFieldBranch(key)[0].name];
}

// eslint-disable-next-line max-statements, complexity
function materializeColumnAsColumnarArray(
  schema: ParquetSchema,
  columnData: ParquetColumnChunk,
  rowCount: number,
  key: string,
  columns: Record<string, ArrayType<any>>
) {
  if (columnData.count <= 0) {
    return;
  }

  const field = schema.findField(key);
  const branch = schema.findFieldBranch(key);

  const columnName = branch[0].name;

  if (branch.length === 1 && field.repetitionType !== 'REPEATED') {
    columns[columnName] = materializeFlatColumn(field, columnData, rowCount);
    return;
  }

  const column: ArrayType = new Array(rowCount);
  for (let i = 0; i < rowCount; i++) {
    column[i] = {};
  }
  columns[columnName] = column;

  // tslint:disable-next-line:prefer-array-literal
  const rLevels: number[] = new Array(field.rLevelMax + 1).fill(0);
  let vIndex = 0;
  for (let i = 0; i < columnData.count; i++) {
    const dLevel = columnData.dlevels[i];
    const rLevel = columnData.rlevels[i];
    rLevels[rLevel]++;
    rLevels.fill(0, rLevel + 1);

    let rIndex = 0;
    let record = column[rLevels[rIndex++] - 1] as ParquetRow;

    // Internal nodes - Build a nested row object
    for (const step of branch) {
      if (step === field || dLevel < step.dLevelMax) {
        break;
      }

      switch (step.repetitionType) {
        case 'REPEATED':
          if (!(step.name in record)) {
            // eslint-disable max-depth
            record[step.name] = [];
          }
          const ix = rLevels[rIndex++];
          while (record[step.name].length <= ix) {
            // eslint-disable max-depth
            record[step.name].push({});
          }
          record = record[step.name][ix];
          break;

        default:
          record[step.name] = record[step.name] || {};
          record = record[step.name];
      }
    }

    // Leaf node - Add the value
    if (dLevel === field.dLevelMax) {
      const value = Types.fromPrimitive(
        // @ts-ignore
        field.originalType || field.primitiveType,
        columnData.values[vIndex],
        field
      );
      vIndex++;

      switch (field.repetitionType) {
        case 'REPEATED':
          if (!(field.name in record)) {
            // eslint-disable max-depth
            record[field.name] = [];
          }
          const ix = rLevels[rIndex];
          while (record[field.name].length <= ix) {
            // eslint-disable max-depth
            record[field.name].push(null);
          }
          record[field.name][ix] = value;
          break;

        default:
          record[field.name] = value;
      }
    }
  }

  // Remove one level of nesting
  for (let i = 0; i < rowCount; ++i) {
    if (columnName in (column[i] as object)) {
      column[i] = (column[i] as object)[columnName];
    }
  }
}

/** Materializes a required or optional top-level primitive column with logical type conversion. */
function materializeFlatColumn(
  field: ParquetField,
  columnData: ParquetColumnChunk,
  rowCount: number
): ArrayType {
  const logicalType = field.originalType || field.primitiveType!;
  const fromPrimitive = Types.PARQUET_LOGICAL_TYPES[logicalType].fromPrimitive;
  const count = Math.min(columnData.count, rowCount);

  if (
    field.repetitionType === 'REQUIRED' &&
    !fromPrimitive &&
    count === rowCount &&
    columnData.values.length === rowCount
  ) {
    return columnData.values;
  }

  const column = new Array(rowCount).fill(null);
  let valueIndex = 0;
  for (let rowIndex = 0; rowIndex < count; rowIndex++) {
    if (columnData.dlevels[rowIndex] === field.dLevelMax) {
      const primitiveValue = columnData.values[valueIndex];
      column[rowIndex] = fromPrimitive ? fromPrimitive(primitiveValue, field) : primitiveValue;
      valueIndex++;
    }
  }
  return column;
}
