// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import {
  convertArrowTableVariableWidthTypes,
  convertArrowVariableWidthVector
} from '@loaders.gl/arrow';
import {getArrowViewTypeSupport, serializeArrowType} from '@loaders.gl/schema-utils';
test('ArrowVariableWidth#convertArrowVariableWidthVector converts Utf8 in both directions', () => {
  const firstChunk = arrow.vectorFromArray(['short', null], new arrow.Utf8());
  const secondChunk = arrow.vectorFromArray(
    ['a string long enough to use an out-of-line view buffer'],
    new arrow.Utf8()
  );
  const utf8Vector = new arrow.Vector([...firstChunk.data, ...secondChunk.data]);
  const viewVector = convertArrowVariableWidthVector(utf8Vector, {viewTypes: 'require'});
  expect(serializeArrowType(viewVector.type), 'converts Utf8 to Utf8View').toBe('utf8-view');
  expect(viewVector.data.length, 'preserves chunk boundaries').toBe(2);
  expect(Array.from(viewVector), 'preserves values and nulls').toEqual(Array.from(utf8Vector));
  const standardVector = convertArrowVariableWidthVector(viewVector);
  expect(serializeArrowType(standardVector.type), 'converts Utf8View to Utf8').toBe('utf8');
  expect(standardVector.data.length, 'preserves converted chunk boundaries').toBe(2);
  expect(Array.from(standardVector), 'round trips values and nulls').toEqual(
    Array.from(utf8Vector)
  );
  expect(
    convertArrowVariableWidthVector(standardVector),
    'returns an already selected type without copying'
  ).toBe(standardVector);
});
test('ArrowVariableWidth#convertArrowVariableWidthVector converts Binary in both directions', () => {
  const binaryVector = arrow.vectorFromArray(
    [new Uint8Array([1, 2, 3]), null, new Uint8Array(20).fill(4)],
    new arrow.Binary()
  );
  const viewVector = convertArrowVariableWidthVector(binaryVector, {viewTypes: 'require'});
  expect(serializeArrowType(viewVector.type), 'converts Binary to BinaryView').toBe('binary-view');
  expect(
    Array.from(viewVector, value => (value ? Array.from(value) : value)),
    'preserves binary values and nulls'
  ).toEqual(Array.from(binaryVector, value => (value ? Array.from(value) : value)));
  const standardVector = convertArrowVariableWidthVector(viewVector, {viewTypes: 'never'});
  expect(serializeArrowType(standardVector.type), 'converts BinaryView to Binary').toBe('binary');
  expect(
    Array.from(standardVector, value => (value ? Array.from(value) : value)),
    'round trips binary values and nulls'
  ).toEqual(Array.from(binaryVector, value => (value ? Array.from(value) : value)));
});
test('ArrowVariableWidth#convertArrowTableVariableWidthTypes converts eligible columns', () => {
  const text = arrow.vectorFromArray(['alpha', 'a sufficiently long beta value'], new arrow.Utf8());
  const payload = arrow.vectorFromArray(
    [new Uint8Array([1]), new Uint8Array(16).fill(2)],
    new arrow.Binary()
  );
  const score = arrow.vectorFromArray([1, 2], new arrow.Int32());
  const table = new arrow.Table({text, payload, score});
  const viewTable = convertArrowTableVariableWidthTypes(table, {viewTypes: 'require'});
  expect(serializeArrowType(viewTable.getChild('text')!.type), 'converts text').toBe('utf8-view');
  expect(serializeArrowType(viewTable.getChild('payload')!.type), 'converts binary').toBe(
    'binary-view'
  );
  expect(
    viewTable.getChild('score')!.data[0],
    'preserves non-variable-width column data without copying'
  ).toBe(score.data[0]);
  expect(viewTable.toArray(), 'preserves table rows').toEqual(table.toArray());
  const standardTable = convertArrowTableVariableWidthTypes(viewTable);
  expect(serializeArrowType(standardTable.getChild('text')!.type), 'normalizes text').toBe('utf8');
  expect(serializeArrowType(standardTable.getChild('payload')!.type), 'normalizes binary').toBe(
    'binary'
  );
  expect(
    convertArrowTableVariableWidthTypes(standardTable),
    'returns an unchanged table without copying'
  ).toBe(standardTable);
});
test('ArrowVariableWidth#runtime support and input validation', () => {
  const support = getArrowViewTypeSupport();
  expect(support.utf8View, 'test runtime provides Utf8View').toBe(true);
  expect(support.binaryView, 'test runtime provides BinaryView').toBe(true);
  expect(
    () => convertArrowVariableWidthVector(arrow.vectorFromArray([1, 2], new arrow.Int32())),
    'rejects unrelated vectors'
  ).toThrow(/Expected an Arrow Utf8, Utf8View, Binary, or BinaryView vector/);
});
