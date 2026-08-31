// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {toArrayBuffer, toBuffer} from '../../../src/lib/node/buffer';
import {promisify1, promisify2, promisify3} from '../../../src/lib/node/promisify';

test('Node buffer adapters preserve bytes and existing instances', () => {
  const buffer = Buffer.from([1, 2, 3]);
  expect(new Uint8Array(toArrayBuffer(buffer))).toEqual(new Uint8Array([1, 2, 3]));
  expect(toArrayBuffer('unchanged')).toBe('unchanged');
  expect(toBuffer(buffer)).toBe(buffer);
  expect(toBuffer(new Uint8Array([4, 5]) as any)).toEqual(Buffer.from([4, 5]));
  expect(toBuffer(new Uint8Array([6, 7]).buffer)).toEqual(Buffer.from([6, 7]));
  expect(() => toBuffer('invalid' as any)).toThrow('toBuffer');
});

test('promisify helpers forward arguments, values, and errors', async () => {
  const one = promisify1<number, number>((value, callback) => callback(null, value + 1));
  const two = promisify2<number, number, number>((left, right, callback) =>
    callback(null, left + right)
  );
  const three = promisify3<number, number, number, number>((one, two, three, callback) =>
    callback(null, one + two + three)
  );
  const failure = promisify1<number, number>((_value, callback) =>
    callback(new Error('failed'), 0)
  );

  await expect(one(1)).resolves.toBe(2);
  await expect(two(2, 3)).resolves.toBe(5);
  await expect(three(1, 2, 3)).resolves.toBe(6);
  await expect(failure(1)).rejects.toThrow('failed');
});
