// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {concatenateStringsAsync, forEach} from '../../../src/lib/iterators/async-iteration';

test('async iteration adapts synchronous iterator completion and errors', async () => {
  expect(await concatenateStringsAsync(['one', '-', 'two'])).toBe('one-two');

  const returnIterator = [1, 2][Symbol.iterator]();
  returnIterator.return = vi.fn(() => ({done: true, value: undefined}));
  const values: number[] = [];
  await forEach(returnIterator, value => {
    values.push(value);
  });
  expect(values).toEqual([1, 2]);
  expect(returnIterator.return).toHaveBeenCalledOnce();

  const earlyIterator = [1, 2, 3][Symbol.iterator]();
  await forEach(earlyIterator, value => value === 2);
  expect(earlyIterator.next().value).toBe(3);
});
