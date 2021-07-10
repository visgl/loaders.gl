// Forked from https://github.com/kbajalc/parquets under MIT license (Copyright (c) 2017 ironSource Ltd.)

import {ParquetBuffer, ParquetData, ParquetField, ParquetRecord} from './declare';
import {ParquetSchema} from './schema';
import * as Types from './types';

export {ParquetBuffer};

export function shredBuffer(schema: ParquetSchema): ParquetBuffer {
  const columnData: Record<string, ParquetData> = {};
  for (const field of schema.fieldList) {
    columnData[field.key] = {
      dlevels: [],
      rlevels: [],
      values: [],
      count: 0
    };
  }
  return {rowCount: 0, columnData};
}

/**
 * 'Shred' a record into a list of <value, repetition_level, definition_level>
 * tuples per column using the Google Dremel Algorithm..
 *
 * The buffer argument must point to an object into which the shredded record
 * will be returned. You may re-use the buffer for repeated calls to this function
 * to append to an existing buffer, as long as the schema is unchanged.
 *
 * The format in which the shredded records will be stored in the buffer is as
 * follows:
 *
 *   buffer = {
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
export function shredRecord(schema: ParquetSchema, record: any, buffer: ParquetBuffer): void {
  /* shred the record, this may raise an exception */
  const data = shredBuffer(schema).columnData;

  shredRecordFields(schema.fields, record, data, 0, 0);

  /* if no error during shredding, add the shredded record to the buffer */
  if (buffer.rowCount === 0) {
    buffer.rowCount = 1;
    buffer.columnData = data;
    return;
  }
  buffer.rowCount += 1;
  for (const field of schema.fieldList) {
    Array.prototype.push.apply(buffer.columnData[field.key].rlevels, data[field.key].rlevels);
    Array.prototype.push.apply(buffer.columnData[field.key].dlevels, data[field.key].dlevels);
    Array.prototype.push.apply(buffer.columnData[field.key].values, data[field.key].values);
    buffer.columnData[field.key].count += data[field.key].count;
  }
}

// eslint-disable-next-line max-statements, complexity
function shredRecordFields(
  fields: Record<string, ParquetField>,
  record: any,
  data: Record<string, ParquetData>,
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
      if (record[field.name].constructor === Array) {
        values = record[field.name];
      } else {
        values.push(record[field.name]);
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
        shredRecordFields(field.fields!, null, data, rLevel, dLevel);
      } else {
        data[field.key].count += 1;
        data[field.key].rlevels.push(rLevel);
        data[field.key].dlevels.push(dLevel);
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
        data[field.key].rlevels.push(rlvl);
        data[field.key].dlevels.push(field.dLevelMax);
        data[field.key].values.push(
          Types.toPrimitive((field.originalType || field.primitiveType)!, values[i])
        );
      }
    }
  }
}

/**
 * 'Materialize' a list of <value, repetition_level, definition_level>
 * tuples back to nested records (objects/arrays) using the Google Dremel
 * Algorithm..
 *
 * The buffer argument must point to an object with the following structure (i.e.
 * the same structure that is returned by shredRecords):
 *
 *   buffer = {
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
export function materializeRecords(schema: ParquetSchema, buffer: ParquetBuffer): ParquetRecord[] {
  const records: ParquetRecord[] = [];
  for (let i = 0; i < buffer.rowCount; i++) records.push({});
  for (const key in buffer.columnData) {
    materializeColumn(schema, buffer, key, records);
  }
  return records;
}

// eslint-disable-next-line max-statements, complexity
function materializeColumn(
  schema: ParquetSchema,
  buffer: ParquetBuffer,
  key: string,
  records: ParquetRecord[]
) {
  const data = buffer.columnData[key];
  if (!data.count) return;

  const field = schema.findField(key);
  const branch = schema.findFieldBranch(key);

  // tslint:disable-next-line:prefer-array-literal
  const rLevels: number[] = new Array(field.rLevelMax + 1).fill(0);
  let vIndex = 0;
  for (let i = 0; i < data.count; i++) {
    const dLevel = data.dlevels[i];
    const rLevel = data.rlevels[i];
    rLevels[rLevel]++;
    rLevels.fill(0, rLevel + 1);

    let rIndex = 0;
    let record = records[rLevels[rIndex++] - 1];

    // Internal nodes
    for (const step of branch) {
      if (step === field) break;
      if (dLevel < step.dLevelMax) break;
      if (step.repetitionType === 'REPEATED') {
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
      } else {
        record[step.name] = record[step.name] || {};
        record = record[step.name];
      }
    }

    // Leaf node
    if (dLevel === field.dLevelMax) {
      const value = Types.fromPrimitive(
        // @ts-ignore
        field.originalType || field.primitiveType,
        data.values[vIndex]
      );
      vIndex++;
      if (field.repetitionType === 'REPEATED') {
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
      } else {
        record[field.name] = value;
      }
    }
  }
}
