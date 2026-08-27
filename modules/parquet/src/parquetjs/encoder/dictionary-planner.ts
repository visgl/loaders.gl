// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {PARQUET_CODECS} from '../codecs/index';
import type {ParquetField} from '../schema/declare';

/** Dictionary selection policy for one Parquet column chunk. */
export type ParquetDictionaryPolicy = boolean | 'auto';

/** A chunk-wide dictionary and the index stream replacing its non-null values. */
export interface ParquetDictionaryPlan {
  /** Unique physical values written to the dictionary page. */
  readonly values: unknown[];
  /** Dictionary index corresponding to every non-null column value. */
  readonly indices: number[];
  /** PLAIN-encoded dictionary page payload. */
  readonly encodedValues: Uint8Array;
  /** Bit width used by RLE_DICTIONARY index pages. */
  readonly bitWidth: number;
}

/** Builds a forced or size-beneficial dictionary plan for a complete column chunk. */
export function planDictionary(
  column: ParquetField,
  values: readonly unknown[],
  policy: ParquetDictionaryPolicy,
  dictionaryPageSizeLimit: number
): ParquetDictionaryPlan | undefined {
  if (!Number.isInteger(dictionaryPageSizeLimit) || dictionaryPageSizeLimit <= 0) {
    throw new Error(
      `Parquet dictionary page size limit must be a positive integer, received ${dictionaryPageSizeLimit}`
    );
  }
  if (policy === false || values.length === 0) {
    if (policy === false && isDictionaryEncoding(column.encoding!)) {
      throw new Error(
        `Parquet column ${column.path.join('.')} requests ${column.encoding} but dictionary encoding is disabled`
      );
    }
    return undefined;
  }

  const dictionaryValues: unknown[] = [];
  const dictionaryIndices = new Map<string, number>();
  const indices = new Array<number>(values.length);
  for (let valueIndex = 0; valueIndex < values.length; valueIndex++) {
    const value = values[valueIndex];
    const key = getDictionaryKey(value);
    let dictionaryIndex = dictionaryIndices.get(key);
    if (dictionaryIndex === undefined) {
      dictionaryIndex = dictionaryValues.length;
      dictionaryIndices.set(key, dictionaryIndex);
      dictionaryValues.push(value);
    }
    indices[valueIndex] = dictionaryIndex;
  }

  const encodedValues = PARQUET_CODECS.PLAIN.encodeValues(column.primitiveType!, dictionaryValues, {
    typeLength: column.typeLength
  });
  if (encodedValues.length > dictionaryPageSizeLimit) {
    return undefined;
  }
  const bitWidth = dictionaryValues.length <= 1 ? 0 : Math.ceil(Math.log2(dictionaryValues.length));
  if (policy === 'auto' && !isDictionaryEncoding(column.encoding!)) {
    const encodedIndices = PARQUET_CODECS.RLE_DICTIONARY.encodeValues(
      column.primitiveType!,
      indices,
      {bitWidth}
    );
    const encodedPrimaryValues = PARQUET_CODECS[column.encoding!].encodeValues(
      column.primitiveType!,
      values as unknown[],
      {typeLength: column.typeLength, bitWidth: column.typeLength}
    );
    if (encodedValues.length + encodedIndices.length >= encodedPrimaryValues.length) {
      return undefined;
    }
  }

  return {values: dictionaryValues, indices, encodedValues, bitWidth};
}

/** Returns a stable content key for one physical Parquet value. */
function getDictionaryKey(value: unknown): string {
  if (value instanceof Uint8Array) {
    let key = `bytes:${value.length}:`;
    for (const byte of value) {
      key += String.fromCharCode(byte);
    }
    return key;
  }
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return 'number:NaN';
    if (Object.is(value, -0)) return 'number:-0';
  }
  return `${typeof value}:${String(value)}`;
}

/** Returns whether the selected primary encoding already requires a dictionary page. */
function isDictionaryEncoding(encoding: string): boolean {
  return encoding === 'PLAIN_DICTIONARY' || encoding === 'RLE_DICTIONARY';
}
