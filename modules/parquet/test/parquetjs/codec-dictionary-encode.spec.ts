// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {PARQUET_CODECS} from '../../src/parquetjs/codecs';
import {planDictionary} from '../../src/parquetjs/encoder/dictionary-planner';
import {ParquetSchema} from '../../src/parquetjs/schema/schema';

test.each([
  {indices: [1, 2, 3], bitWidth: 2},
  {indices: [300, 300, 300, 300], bitWidth: 9}
])('dictionary index encoder round-trips $indices at bit width $bitWidth', ({indices, bitWidth}) => {
  const encoded = PARQUET_CODECS.RLE_DICTIONARY.encodeValues('INT32', indices, {bitWidth});
  const decoded = PARQUET_CODECS.RLE_DICTIONARY.decodeValues(
    'INT32',
    {buffer: encoded, offset: 0, size: encoded.length},
    indices.length,
    {}
  );
  expect(Array.from(decoded)).toEqual(indices);
});

test.each([
  {indices: [0, 1, 0, 1, 1, 0, 1, 0], bitWidth: 1},
  {indices: [0, 1, 2, 3, 3, 2, 1, 0], bitWidth: 2},
  {indices: [0, 1, 2, 3, 4, 5, 6, 7], bitWidth: 3},
  {indices: [0, 3, 6, 9, 12, 15, 8, 1], bitWidth: 4}
])('dictionary decoder resolves specialized $bitWidth-bit indices', ({indices, bitWidth}) => {
  const dictionary = Array.from({length: 2 ** bitWidth}, (_, index) => `value-${index}`);
  const encoded = PARQUET_CODECS.RLE_DICTIONARY.encodeValues('INT32', indices, {bitWidth});
  const decoded = PARQUET_CODECS.RLE_DICTIONARY.decodeValues(
    'INT32',
    {buffer: encoded, offset: 0, size: encoded.length},
    indices.length,
    {dictionary}
  );
  expect(Array.from(decoded)).toEqual(indices.map(index => dictionary[index]));
});

test('dictionary planner selects low-cardinality values and rejects larger output', () => {
  const column = new ParquetSchema({value: {type: 'UTF8'}}).fields.value;
  const repeatedValues = Array.from({length: 100}, (_, index) =>
    new TextEncoder().encode(index % 2 ? 'alpha' : 'beta')
  );
  const uniqueValues = Array.from({length: 20}, (_, index) =>
    new TextEncoder().encode(`unique-${index}`)
  );

  const plan = planDictionary(column, repeatedValues, 'auto', 1024);
  expect(plan?.values).toHaveLength(2);
  expect(plan?.indices).toHaveLength(100);
  expect(planDictionary(column, uniqueValues, 'auto', 1024)).toBeUndefined();
  expect(planDictionary(column, repeatedValues, true, 1)).toBeUndefined();
});
