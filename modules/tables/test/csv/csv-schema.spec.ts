// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {Field} from '@loaders.gl/core/schema';
import {parseCSVSchemaRow} from '../../src/csv/lib/csv-schema';

test.each([
  ['utf8-view', ' 001 ', ' 001 '],
  ['bool', ' TRUE ', true],
  ['bool', 'false', false],
  ['float32', '0.1', Math.fround(0.1)],
  ['float64', '-1.25e2', -125],
  ['int8', '-128', -128],
  ['uint32', '4294967295', 4294967295],
  ['int64', '-9223372036854775808', -9223372036854775808n],
  ['uint64', '18446744073709551615', 18446744073709551615n]
] as const)('parses declared %s cell %s', (type, cell, expected) => {
  expect(parseCSVSchemaRow({fields: [{name: 'value', type}], metadata: {}}, [cell])).toEqual([
    expected
  ]);
});

test.each([
  ['bool', 'yes'],
  ['float32', '1e40'],
  ['float64', 'Infinity'],
  ['int8', '128'],
  ['int8', '1.5'],
  ['uint8', '-1'],
  ['uint64', '18446744073709551616']
] as const)('rejects invalid %s cell %s', (type, cell) => {
  expect(() => parseCSVSchemaRow({fields: [{name: 'value', type}], metadata: {}}, [cell])).toThrow(
    'Invalid CSV value for value'
  );
});

test('distinguishes missing required fields from nullable fields and unsupported types', () => {
  const field: Field = {name: 'value', type: 'int32', nullable: false};
  expect(() => parseCSVSchemaRow({fields: [field], metadata: {}}, [])).toThrow(
    'Missing CSV value for value'
  );
  expect(parseCSVSchemaRow({fields: [{...field, nullable: true}], metadata: {}}, [])).toEqual([
    null
  ]);
  expect(() =>
    parseCSVSchemaRow({fields: [{...field, type: 'binary'}], metadata: {}}, ['data'])
  ).toThrow('Unsupported CSV schema type for value');
});
