// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Field, Schema} from '@loaders.gl/core/schema';

const NUMBER = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
const INTEGER = /^[+-]?\d+$/;

/** Checks that declared field names and order agree with the CSV columns. */
export function validateCSVSchemaHeader(schema: Schema, columns: readonly string[]): void {
  if (
    schema.fields.length !== columns.length ||
    schema.fields.some((field, index) => field.name !== columns[index])
  ) {
    throw new Error('csv.schema fields must match CSV columns in file order');
  }
}

/** Parses raw CSV cells according to the declared schema. */
export function parseCSVSchemaRow(schema: Schema, row: readonly string[]): unknown[] {
  if (row.length > schema.fields.length) {
    throw new Error('CSV row contains more fields than csv.schema');
  }
  return schema.fields.map((field, index) => parseCSVField(field, row[index]));
}

/** Parses a scalar CSV cell and rejects invalid values before building a table. */
function parseCSVField(field: Field, value: string | undefined): unknown {
  const {type} = field;
  if (value === undefined || value === '') {
    if (field.nullable === false) {
      throw new Error(`Missing CSV value for ${field.name}`);
    }
    return null;
  }

  if (type === 'utf8' || type === 'utf8-view') {
    return value;
  }
  const text = value.trim();
  if (type === 'bool') {
    if (/^(true|false)$/i.test(text)) {
      return text.toLowerCase() === 'true';
    }
  } else if (type === 'float32' || type === 'float64') {
    const number = Number(text);
    if (NUMBER.test(text) && Number.isFinite(type === 'float32' ? Math.fround(number) : number)) {
      return type === 'float32' ? Math.fround(number) : number;
    }
  } else if (typeof type === 'string' && /^(u?int)(8|16|32|64)$/.test(type)) {
    if (INTEGER.test(text)) {
      const unsigned = type.startsWith('u');
      const bits = BigInt(type.slice(unsigned ? 4 : 3));
      const bound = 1n << (unsigned ? bits : bits - 1n);
      const number = BigInt(text);
      if (number >= (unsigned ? 0n : -bound) && number < bound) {
        return bits === 64n ? number : Number(number);
      }
    }
  } else {
    throw new Error(`Unsupported CSV schema type for ${field.name}`);
  }
  throw new Error(`Invalid CSV value for ${field.name}`);
}
