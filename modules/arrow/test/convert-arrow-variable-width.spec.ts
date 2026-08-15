// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import * as arrow from 'apache-arrow';

import {
  convertArrowTableVariableWidthTypes,
  convertArrowVariableWidthVector
} from '@loaders.gl/arrow';
import {getArrowViewTypeSupport, serializeArrowType} from '@loaders.gl/schema-utils';

test('ArrowVariableWidth#convertArrowVariableWidthVector converts Utf8 in both directions', t => {
  const firstChunk = arrow.vectorFromArray(['short', null], new arrow.Utf8());
  const secondChunk = arrow.vectorFromArray(
    ['a string long enough to use an out-of-line view buffer'],
    new arrow.Utf8()
  );
  const utf8Vector = new arrow.Vector([...firstChunk.data, ...secondChunk.data]);

  const viewVector = convertArrowVariableWidthVector(utf8Vector, {viewTypes: 'require'});
  t.equal(serializeArrowType(viewVector.type), 'utf8-view', 'converts Utf8 to Utf8View');
  t.equal(viewVector.data.length, 2, 'preserves chunk boundaries');
  t.deepEqual(Array.from(viewVector), Array.from(utf8Vector), 'preserves values and nulls');

  const standardVector = convertArrowVariableWidthVector(viewVector);
  t.equal(serializeArrowType(standardVector.type), 'utf8', 'converts Utf8View to Utf8');
  t.equal(standardVector.data.length, 2, 'preserves converted chunk boundaries');
  t.deepEqual(Array.from(standardVector), Array.from(utf8Vector), 'round trips values and nulls');
  t.equal(
    convertArrowVariableWidthVector(standardVector),
    standardVector,
    'returns an already selected type without copying'
  );
  t.end();
});

test('ArrowVariableWidth#convertArrowVariableWidthVector converts Binary in both directions', t => {
  const binaryVector = arrow.vectorFromArray(
    [new Uint8Array([1, 2, 3]), null, new Uint8Array(20).fill(4)],
    new arrow.Binary()
  );

  const viewVector = convertArrowVariableWidthVector(binaryVector, {viewTypes: 'require'});
  t.equal(serializeArrowType(viewVector.type), 'binary-view', 'converts Binary to BinaryView');
  t.deepEqual(
    Array.from(viewVector, value => (value ? Array.from(value) : value)),
    Array.from(binaryVector, value => (value ? Array.from(value) : value)),
    'preserves binary values and nulls'
  );

  const standardVector = convertArrowVariableWidthVector(viewVector, {viewTypes: 'never'});
  t.equal(serializeArrowType(standardVector.type), 'binary', 'converts BinaryView to Binary');
  t.deepEqual(
    Array.from(standardVector, value => (value ? Array.from(value) : value)),
    Array.from(binaryVector, value => (value ? Array.from(value) : value)),
    'round trips binary values and nulls'
  );
  t.end();
});

test('ArrowVariableWidth#convertArrowTableVariableWidthTypes converts eligible columns', t => {
  const text = arrow.vectorFromArray(['alpha', 'a sufficiently long beta value'], new arrow.Utf8());
  const payload = arrow.vectorFromArray(
    [new Uint8Array([1]), new Uint8Array(16).fill(2)],
    new arrow.Binary()
  );
  const score = arrow.vectorFromArray([1, 2], new arrow.Int32());
  const table = new arrow.Table({text, payload, score});

  const viewTable = convertArrowTableVariableWidthTypes(table, {viewTypes: 'require'});
  t.equal(serializeArrowType(viewTable.getChild('text')!.type), 'utf8-view', 'converts text');
  t.equal(
    serializeArrowType(viewTable.getChild('payload')!.type),
    'binary-view',
    'converts binary'
  );
  t.equal(
    viewTable.getChild('score')!.data[0],
    score.data[0],
    'preserves non-variable-width column data without copying'
  );
  t.deepEqual(viewTable.toArray(), table.toArray(), 'preserves table rows');

  const standardTable = convertArrowTableVariableWidthTypes(viewTable);
  t.equal(serializeArrowType(standardTable.getChild('text')!.type), 'utf8', 'normalizes text');
  t.equal(
    serializeArrowType(standardTable.getChild('payload')!.type),
    'binary',
    'normalizes binary'
  );
  t.equal(
    convertArrowTableVariableWidthTypes(standardTable),
    standardTable,
    'returns an unchanged table without copying'
  );
  t.end();
});

test('ArrowVariableWidth#runtime support and input validation', t => {
  const support = getArrowViewTypeSupport();
  t.equal(support.utf8View, true, 'test runtime provides Utf8View');
  t.equal(support.binaryView, true, 'test runtime provides BinaryView');
  t.throws(
    () => convertArrowVariableWidthVector(arrow.vectorFromArray([1, 2], new arrow.Int32())),
    /Expected an Arrow Utf8, Utf8View, Binary, or BinaryView vector/,
    'rejects unrelated vectors'
  );
  t.end();
});
