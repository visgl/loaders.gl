// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';

import {createNestedArrowVector} from '../src/lib/arrow/create-nested-arrow-vector';

const PRIMITIVE_CASES: Array<{
  arrowType: arrow.DataType;
  primitiveType: string;
  typedValues: ArrayLike<number | bigint>;
  genericValues: Array<number | bigint | string>;
}> = [
  {arrowType: new arrow.Float32(), primitiveType: 'FLOAT', typedValues: new Float32Array([1, 2, 3]), genericValues: [1, 2, 3]},
  {arrowType: new arrow.Float64(), primitiveType: 'DOUBLE', typedValues: new Float64Array([1, 2, 3]), genericValues: [1, 2, 3]},
  {arrowType: new arrow.Int8(), primitiveType: 'INT32', typedValues: new Int8Array([1, 2, 3]), genericValues: [1, 2, 3]},
  {arrowType: new arrow.Int16(), primitiveType: 'INT32', typedValues: new Int16Array([1, 2, 3]), genericValues: [1, 2, 3]},
  {arrowType: new arrow.Int32(), primitiveType: 'INT32', typedValues: new Int32Array([1, 2, 3]), genericValues: [1, 2, 3]},
  {arrowType: new arrow.Uint8(), primitiveType: 'INT32', typedValues: new Uint8Array([1, 2, 3]), genericValues: [1, 2, 3]},
  {arrowType: new arrow.Uint16(), primitiveType: 'INT32', typedValues: new Uint16Array([1, 2, 3]), genericValues: [1, 2, 3]},
  {arrowType: new arrow.Uint32(), primitiveType: 'INT32', typedValues: new Uint32Array([1, 2, 3]), genericValues: [1, 2, 3]},
  {arrowType: new arrow.DateDay(), primitiveType: 'INT32', typedValues: new Int32Array([1, 2, 3]), genericValues: [1, 2, 3]},
  {arrowType: new arrow.TimeMillisecond(), primitiveType: 'INT32', typedValues: new Int32Array([1, 2, 3]), genericValues: [1, 2, 3]},
  {arrowType: new arrow.Int64(), primitiveType: 'INT64', typedValues: new BigInt64Array([1n, 2n, 3n]), genericValues: ['1', 2, 3n]},
  {arrowType: new arrow.Uint64(), primitiveType: 'INT64', typedValues: new BigUint64Array([1n, 2n, 3n]), genericValues: ['1', 2, 3n]},
  {arrowType: new arrow.TimeMicrosecond(), primitiveType: 'INT64', typedValues: new BigInt64Array([1n, 2n, 3n]), genericValues: [1, 2, 3]},
  {arrowType: new arrow.TimeNanosecond(), primitiveType: 'INT64', typedValues: new BigInt64Array([1n, 2n, 3n]), genericValues: [1, 2, 3]},
  {arrowType: new arrow.TimestampMillisecond(), primitiveType: 'INT64', typedValues: new BigInt64Array([1n, 2n, 3n]), genericValues: [1, 2, 3]},
  {arrowType: new arrow.TimestampMicrosecond(), primitiveType: 'INT64', typedValues: new BigInt64Array([1n, 2n, 3n]), genericValues: [1, 2, 3]},
  {arrowType: new arrow.TimestampNanosecond(), primitiveType: 'INT64', typedValues: new BigInt64Array([1n, 2n, 3n]), genericValues: [1, 2, 3]}
];

test.each(PRIMITIVE_CASES)(
  'createNestedArrowVector builds repeated primitive vectors from typed and generic values',
  ({arrowType, primitiveType, typedValues, genericValues}) => {
    const field = createRepeatedField(primitiveType);
    const listType = new arrow.List(new arrow.Field('item', arrowType, true));
    const typedVector = createNestedArrowVector(
      listType,
      field,
      createRowGroup(typedValues),
      0,
      2
    );
    const genericVector = createNestedArrowVector(
      listType,
      field,
      createRowGroup(genericValues),
      0,
      2
    );

    expect(typedVector?.length).toBe(2);
    expect(typedVector?.get(0)?.length).toBe(2);
    expect(typedVector?.get(1)?.length).toBe(1);
    expect(genericVector?.length).toBe(2);
    expect(genericVector?.get(0)?.length).toBe(2);
  }
);

test('createNestedArrowVector builds inline, copied, and buffered repeated byte values', () => {
  const utf8Field = {...createRepeatedField('BYTE_ARRAY'), originalType: 'UTF8'};
  const utf8Type = new arrow.List(new arrow.Field('item', new arrow.Utf8(), true));
  const values = ['short', 'a value longer than seven bytes', 'last'].map(value =>
    new TextEncoder().encode(value)
  );
  const valueVector = createNestedArrowVector(utf8Type, utf8Field, createRowGroup(values), 0, 2)!;
  expect(valueVector.get(0)?.toArray()).toEqual(['short', 'a value longer than seven bytes']);

  const data = new TextEncoder().encode('onetwo-longer');
  const bufferedVector = createNestedArrowVector(
    utf8Type,
    utf8Field,
    createRowGroup([], {data, valueOffsets: new Int32Array([0, 3, data.length])}, [0, 0], [1, 1]),
    0,
    2
  )!;
  expect(bufferedVector.get(0)?.toArray()).toEqual(['one']);
  expect(bufferedVector.get(1)?.toArray()).toEqual(['two-longer']);

  const binaryField = {...createRepeatedField('FIXED_LEN_BYTE_ARRAY'), originalType: 'GEOMETRY'};
  const binaryType = new arrow.List(new arrow.Field('item', new arrow.Binary(), true));
  expect(createNestedArrowVector(binaryType, binaryField, createRowGroup(values), 0, 2)?.length).toBe(2);
});

test('createNestedArrowVector declines unsupported repetition trees and missing columns', () => {
  const listType = new arrow.List(new arrow.Field('item', new arrow.Int32(), true));
  expect(createNestedArrowVector(new arrow.Int32(), createRepeatedField('INT32'), createRowGroup([]), 0, 1)).toBeUndefined();
  expect(createNestedArrowVector(listType, {...createRepeatedField('INT32'), repetitionType: 'OPTIONAL'}, createRowGroup([]), 0, 1)).toBeUndefined();
  expect(createNestedArrowVector(listType, createRepeatedField('INT32'), {columnData: {}} as any, 0, 1)).toBeUndefined();

  const structField = {
    ...createRepeatedField(undefined),
    fields: {value: {...createRepeatedField('INT32'), repetitionType: 'OPTIONAL'}}
  };
  expect(createNestedArrowVector(listType, structField as any, createRowGroup([]), 0, 1)).toBeUndefined();
  const structType = new arrow.List(
    new arrow.Field('item', new arrow.Struct([new arrow.Field('missing', new arrow.Int32(), true)]), true)
  );
  expect(createNestedArrowVector(structType, structField as any, createRowGroup([]), 0, 1)).toBeUndefined();
});

function createRepeatedField(primitiveType: string | undefined): any {
  return {
    key: 'values',
    name: 'values',
    primitiveType,
    repetitionType: 'REPEATED',
    dLevelMax: 1,
    rLevelMax: 1
  };
}

function createRowGroup(
  values: ArrayLike<unknown>,
  byteArrayData?: {data: Uint8Array; valueOffsets: Int32Array},
  repetitionLevels: number[] = [0, 1, 0],
  definitionLevels: number[] = [1, 1, 1]
): any {
  return {
    columnData: {
      values: {
        values,
        byteArrayData,
        rlevels: new Uint8Array(repetitionLevels),
        dlevels: new Uint8Array(definitionLevels)
      }
    }
  };
}
