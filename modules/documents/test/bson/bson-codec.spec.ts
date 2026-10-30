// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  BSONObjectId,
  createBSONValue,
  encodeBSONSync,
  parseBSONSync,
  type BSONTaggedValue
} from '../../src/bson-codec';
import {BSONWriter} from '../../src/bson-writer';
import referenceCases from './data/native-bson-wire.json';

/** Converts an independently specified wire fixture into an exact buffer. */
function fromHex(hex: string): ArrayBuffer {
  return Uint8Array.from(hex.match(/../g) || [], byte => Number.parseInt(byte, 16)).buffer;
}

/** Returns uppercase hexadecimal wire bytes for corpus comparison. */
function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

test.each(referenceCases)('BSON independent wire round trip: $name', ({hex}) => {
  const decoded = parseBSONSync(fromHex(hex), {preserveTypes: true});
  expect(toHex(encodeBSONSync(decoded))).toBe(hex.toUpperCase());
});

test('BSON native values preserve Unicode, nested arrays, binary, dates, and exact buffer ranges', () => {
  const document = {
    text: '\uFEFFhéllo 🌍\0tail',
    number: 3.5,
    negativeZero: -0,
    infinity: Infinity,
    nan: NaN,
    boolean: true,
    empty: null,
    nested: {array: [null, false, {key: 'value'}]},
    bytes: new Uint8Array([1, 2, 3, 4]).subarray(1, 3),
    date: new Date('2020-01-02T03:04:05.006Z'),
    id: new BSONObjectId('514825FA2A26EA0200000006'),
    large: 9223372036854775807n,
    small: -9223372036854775808n
  };
  const encoded = encodeBSONSync(document);
  const decoded = parseBSONSync(encoded);
  expect(decoded).toEqual(document);
  expect(String(decoded.id)).toBe('514825fa2a26ea0200000006');
  (decoded.bytes as Uint8Array)[0] = 99;
  expect(parseBSONSync(encoded).bytes).toEqual(new Uint8Array([2, 3]));
});

test('BSON int64 promotion never loses precision and can preserve wire types', () => {
  const encoded = encodeBSONSync({safe: 42n, unsafe: 9007199254740993n});
  expect(parseBSONSync(encoded)).toEqual({safe: 42, unsafe: 9007199254740993n});
  expect(parseBSONSync(encoded, {useBigInt64: true})).toEqual({
    safe: 42n,
    unsafe: 9007199254740993n
  });
  expect(parseBSONSync(encoded, {promoteLongs: false}).safe).toEqual({
    $bsonType: 'int64',
    value: 42n
  });
});

test('BSON tagged payloads preserve opaque subtypes, Decimal128, and unevaluated code', () => {
  const values: BSONTaggedValue[] = [
    {$bsonType: 'binary', subtype: 9, data: new Uint8Array([0, 1, 255])},
    {$bsonType: 'decimal128', bytes: Uint8Array.from({length: 16}, (_, index) => index)},
    {$bsonType: 'regexp', pattern: '[invalid', options: 'imx'},
    {$bsonType: 'code', code: 'throw new Error("never execute")', scope: {answer: 42}},
    {$bsonType: 'timestamp', value: 18446744073709551615n},
    {$bsonType: 'date', value: 9223372036854775807n},
    {
      $bsonType: 'dbPointer',
      namespace: 'database.collection',
      objectId: new BSONObjectId(new Uint8Array(12))
    },
    {$bsonType: 'undefined'},
    {$bsonType: 'symbol', value: 'symbol'},
    {$bsonType: 'minKey'},
    {$bsonType: 'maxKey'}
  ];
  expect(
    parseBSONSync(encodeBSONSync({values: values.map(value => createBSONValue(value))}))
  ).toEqual({values});
});

test('BSON decoding and encoding treat prototype-sensitive keys as document data', () => {
  const document = JSON.parse('{"__proto__":{"polluted":true},"constructor":1,"prototype":2}');
  const decoded = parseBSONSync(encodeBSONSync(document));
  expect(Object.getPrototypeOf(decoded)).toBe(Object.prototype);
  expect(Object.hasOwn(decoded, '__proto__')).toBe(true);
  expect(decoded).toEqual(document);
  expect(({} as Record<string, unknown>).polluted).toBeUndefined();
});

test('BSON writer forwards options and normalizes undefined and sparse array slots', async () => {
  const document = {missing: undefined, array: [undefined, , 2]};
  expect(parseBSONSync(encodeBSONSync(document))).toEqual({array: [null, null, 2]});
  const options = {bson: {ignoreUndefined: false}};
  expect(parseBSONSync(BSONWriter.encodeSync(document, options))).toEqual({
    missing: null,
    array: [null, null, 2]
  });
  expect(await BSONWriter.encode(document, options)).toEqual(
    BSONWriter.encodeSync(document, options)
  );
});

test('BSON enforces depth limits, permits shared values, and rejects cycles', () => {
  const shared = {value: 1};
  const document = {first: shared, second: shared};
  const bytes = encodeBSONSync(document, {maxDepth: 2});
  expect(parseBSONSync(bytes, {maxDepth: 2})).toEqual(document);
  expect(() => encodeBSONSync(document, {maxDepth: 1})).toThrow(/depth/);
  expect(() => parseBSONSync(bytes, {maxDepth: 1})).toThrow(/depth/);
  const cyclic: Record<string, unknown> = {};
  cyclic.self = cyclic;
  expect(() => encodeBSONSync(cyclic)).toThrow(/cyclic/);
  const scoped: Record<string, unknown> = {};
  scoped.code = createBSONValue({$bsonType: 'code', code: '', scope: scoped});
  expect(() => encodeBSONSync(scoped)).toThrow(/cyclic/);
});

test.each([0, -1, 1.5, Infinity, NaN])('BSON rejects invalid maxDepth %s', maxDepth => {
  expect(() => encodeBSONSync({}, {maxDepth})).toThrow(/maxDepth/);
  expect(() => parseBSONSync(fromHex('0500000000'), {maxDepth})).toThrow(/maxDepth/);
});

test.each([
  {value: 1n << 63n},
  {value: -(1n << 63n) - 1n},
  {value: () => 1},
  {value: new Map()},
  {value: Symbol('x')},
  {value: new Date(NaN)},
  {value: /x/g},
  {value: {$bsonType: 'binary', subtype: 256, data: new Uint8Array()}},
  {value: {$bsonType: 'binary', subtype: 0, data: 'invalid'}},
  {value: {$bsonType: 'decimal128', bytes: new Uint8Array(15)}},
  {value: {$bsonType: 'timestamp', value: -1n}},
  {value: {$bsonType: 'int64', value: 1}},
  {value: {$bsonType: 'int32', value: 1.5}},
  {value: {$bsonType: 'unknown'}},
  {value: {$bsonType: 'code', code: '', scope: []}},
  {value: {$bsonType: 'code', code: 1}},
  {value: {$bsonType: 'regexp', pattern: 'x\0y', options: ''}},
  {value: {$bsonType: 'dbPointer', namespace: '', objectId: 'invalid'}}
])('BSON rejects unsupported or malformed encoder input %#', document => {
  const value = document.value;
  const input =
    value && typeof value === 'object' && '$bsonType' in value
      ? {value: createBSONValue(value as any)}
      : document;
  expect(() => encodeBSONSync(input)).toThrow();
});

test('BSON validates roots, ObjectIds, keys, unknown tags, and exact trailing boundaries', () => {
  for (const root of [null, [], new Date()])
    expect(() => encodeBSONSync(root as any)).toThrow(/root/);
  expect(() => new BSONObjectId('not-hex')).toThrow(/ObjectId/);
  expect(() => new BSONObjectId(new Uint8Array(13))).toThrow(/ObjectId/);
  expect(() => encodeBSONSync({'null\0key': 1})).toThrow(/cstring/);
  expect(() => parseBSONSync(fromHex('0800000020610000'))).toThrow(/unsupported element/);
  expect(() => parseBSONSync(fromHex('050000000001'))).toThrow(/declares/);
  expect(() => parseBSONSync(fromHex('010203'))).toThrow(/at least/);
});

/** Builds a one-field document independently of the codec under test. */
function wrapPayload(type: number, payload: number[]): ArrayBuffer {
  const bytes = new Uint8Array(8 + payload.length);
  new DataView(bytes.buffer).setInt32(0, bytes.length, true);
  bytes.set([type, 118, 0, ...payload], 4);
  return bytes.buffer;
}

test.each([
  [1, [0, 0]],
  [2, [0, 0, 0, 0]],
  [2, [255, 255, 255, 255]],
  [2, [2, 0, 0, 0, 65, 1]],
  [2, [2, 0, 0, 0, 255, 0]],
  [3, [4, 0, 0, 0]],
  [3, [6, 0, 0, 0, 0]],
  [3, [5, 0, 0, 0, 1]],
  [4, [12, 0, 0, 0, 16, 49, 0, 1, 0, 0, 0, 0]],
  [5, [255, 255, 255, 255, 0]],
  [5, [4, 0, 0, 0, 2, 1, 0, 0, 0]],
  [5, [3, 0, 0, 0, 2, 0, 0, 0]],
  [5, [3, 0, 0, 0, 0, 1]],
  [7, [0]],
  [8, [2]],
  [9, [0]],
  [11, [97]],
  [11, [97, 0, 122, 0]],
  [12, [1, 0, 0, 0, 0]],
  [15, [13, 0, 0, 0]],
  [15, [15, 0, 0, 0, 1, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0]],
  [16, [0]],
  [17, [0]],
  [18, [0]],
  [19, [0]],
  [0, []]
] as [number, number[]][])('BSON rejects malformed element payload %#', (type, payload) => {
  expect(() => parseBSONSync(wrapPayload(type, payload))).toThrow();
});

test('BSON rejects every truncated prefix without reading outside the declared document', () => {
  const encoded = encodeBSONSync({a: 'value', b: {c: [1, false]}, d: new Uint8Array([1, 2])});
  for (let length = 5; length < encoded.byteLength; length++) {
    const truncated = encoded.slice(0, length);
    new DataView(truncated).setInt32(0, length, true);
    expect(() => parseBSONSync(truncated), `prefix length ${length}`).toThrow();
  }
});

test('BSON supports duplicate keys safely, legacy undefined, and noncanonical regex flag order', () => {
  expect(parseBSONSync(fromHex('13000000107600010000001076000200000000'))).toEqual({v: 2});
  expect(parseBSONSync(wrapPayload(6, []))).toEqual({v: {$bsonType: 'undefined'}});
  expect(parseBSONSync(wrapPayload(11, [97, 0, 120, 109, 105, 0]))).toEqual({
    v: {$bsonType: 'regexp', pattern: 'a', options: 'imx'}
  });
  expect(parseBSONSync(encodeBSONSync({v: /a/imu}))).toHaveProperty('v', {
    $bsonType: 'regexp',
    pattern: 'a',
    options: 'imu'
  });
});

test('BSON scalar markers never reserve ordinary document property names', () => {
  const document = {
    nested: {$bsonType: 'undefined'},
    unknown: {$bsonType: 'unrecognized', value: 42}
  };
  const decoded = parseBSONSync(encodeBSONSync(document));
  expect(decoded).toEqual(document);
  expect(parseBSONSync(encodeBSONSync(decoded))).toEqual(document);
});

test.each(['l', 'ilmsux'])('BSON preserves locale regex option in %s', options => {
  const bytes = wrapPayload(11, [97, 0, ...new TextEncoder().encode(options), 0]);
  const decoded = parseBSONSync(bytes);
  expect(decoded).toEqual({v: {$bsonType: 'regexp', pattern: 'a', options}});
  expect(encodeBSONSync(decoded)).toEqual(bytes);
  expect(
    encodeBSONSync({v: createBSONValue({$bsonType: 'regexp', pattern: 'a', options})})
  ).toEqual(bytes);
});
