// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {serializeBinaryJSON, deserializeBinaryJSON} from '../../src/json/lib/json-binary-transport';

// JSON.parse accepts overflow numbers and negative zero; ordinary JSON.stringify loses them.
test.each([
  undefined,
  null,
  -0,
  Infinity,
  -Infinity,
  NaN,
  123n
])('binary JSON preserves exceptional root value %s', value => {
  const serialized = serializeBinaryJSON(value);
  const received = structuredClone(serialized, {transfer: [serialized.data.buffer as ArrayBuffer]});
  expect(serialized.data.byteLength).toBe(0);
  expect(deserializeBinaryJSON(received)).toBe(value);
});

test('binary JSON preserves nested heterogeneous values and collision-prone property names', () => {
  const value = JSON.parse(
    '{"__proto__":{"number":-0},"rows":[{"id":1},{"id":"雪😀","extra":[1e400,-1e400]}],"transport":"json-utf8"}'
  );
  value.rows[0].missing = undefined;
  const received = deserializeBinaryJSON(serializeBinaryJSON(value));
  expect(received).toEqual(value);
  expect(Object.hasOwn(received.rows[0], 'missing')).toBe(true);
  expect(Object.is(received.__proto__.number, -0)).toBe(true);
  expect(Object.getPrototypeOf(received)).toBe(Object.prototype);
});

test('binary JSON rejects unsupported callable values and invalid restoration paths', () => {
  expect(() => serializeBinaryJSON(() => {})).toThrow('JSON values');
  for (const path of [['__proto__', 'polluted'], ['missing']]) {
    const data = new TextEncoder().encode(
      JSON.stringify([{}, [{path, type: 'number', value: 'Infinity'}]])
    );
    expect(() => deserializeBinaryJSON({transport: 'json-utf8', data})).toThrow(
      'Invalid JSON worker value path'
    );
  }
  expect(Object.hasOwn(Object.prototype, 'polluted')).toBe(false);
});

test.each([
  null,
  {rows: [{id: 1}]},
  {transport: 'json-utf8', data: 'ordinary document field'}
])('binary JSON reader accepts legacy custom-worker value %j', value => {
  expect(deserializeBinaryJSON(value)).toBe(value);
});
