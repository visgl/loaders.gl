// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parse} from '@loaders.gl/core';
import {I3SAttributeLoader} from '@loaders.gl/i3s';

/** Small independent numeric resource with explicit little-endian integer bytes. */
function createIntegerResource(signed: boolean) {
  const values = signed
    ? [-(2n ** 63n), -9007199254740993n, 2n ** 63n - 1n]
    : [0n, 9007199254740993n, 2n ** 64n - 1n];
  const buffer = new ArrayBuffer(8 + values.length * 8);
  const view = new DataView(buffer);
  view.setUint32(0, values.length, true);
  values.forEach((value, index) =>
    signed
      ? view.setBigInt64(8 + index * 8, value, true)
      : view.setBigUint64(8 + index * 8, value, true)
  );
  return {buffer, values};
}

test.each([
  'Int64',
  'UInt64'
])('exact I3S %s decoding preserves integer boundaries without changing legacy output', async attributeType => {
  const {buffer, values} = createIntegerResource(attributeType === 'Int64');
  const exact = await parse(buffer, I3SAttributeLoader, {
    attributeName: 'id',
    attributeType,
    i3s: {attributeValues: 'exact'}
  });
  expect(exact.id).toBeInstanceOf(attributeType === 'Int64' ? BigInt64Array : BigUint64Array);
  expect(Array.from(exact.id as BigInt64Array)).toEqual(values);
  const legacy = await parse(buffer, I3SAttributeLoader, {attributeName: 'id', attributeType});
  expect(legacy.id).toBeInstanceOf(Float64Array);
  expect(Array.from(legacy.id as Float64Array)).toEqual(values.map(Number));
});

test.each([
  'Oid32',
  'UInt8',
  'UInt16',
  'UInt32',
  'Int16',
  'Int32',
  'Float32',
  'Float64'
])('exact %s checks declared scalar counts', async attributeType => {
  const width = {
    Oid32: 4,
    UInt8: 1,
    UInt16: 2,
    UInt32: 4,
    Int16: 2,
    Int32: 4,
    Float32: 4,
    Float64: 8
  }[attributeType]!;
  const buffer = new ArrayBuffer(Math.max(4, width) + width);
  new DataView(buffer).setUint32(0, 1, true);
  expect(
    (
      await parse(buffer, I3SAttributeLoader, {
        attributeName: 'value',
        attributeType,
        i3s: {attributeValues: 'exact'}
      })
    ).value
  ).toHaveLength(1);
  new DataView(buffer).setUint32(0, 2, true);
  await expect(
    parse(buffer, I3SAttributeLoader, {
      attributeName: 'value',
      attributeType,
      i3s: {attributeValues: 'exact'}
    })
  ).rejects.toThrow('matching count/length');
});

test.each([
  ['Int8', new ArrayBuffer(4)],
  ['UInt64', new ArrayBuffer(4)],
  ['Int64', new ArrayBuffer(9)],
  ['Float64', new ArrayBuffer(17)]
])('exact numeric decoding rejects unsupported or truncated layout %s', async (attributeType, buffer) => {
  await expect(
    parse(buffer, I3SAttributeLoader, {
      attributeName: 'value',
      attributeType,
      i3s: {attributeValues: 'exact'}
    })
  ).rejects.toThrow('matching count/length');
});
