// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {waitForCondition} from '@loaders.gl/test-utils/vitest';

import {executeScanTasks} from '../../../src/lib/scan-utils/scan-executor';

test('executeScanTasks overlaps work while preserving task order', async () => {
  const started: number[] = [];
  const tasks = [0, 1, 2].map(index => ({
    run: async function* (): AsyncIterable<number> {
      started.push(index);
      const deadline = Date.now() + (index === 0 ? 20 : 1);
      await waitForCondition(() => Date.now() >= deadline, {timeoutMs: 100, intervalMs: 1});
      yield index;
    }
  }));

  const values: number[] = [];
  for await (const value of executeScanTasks(toAsyncIterable(tasks), {concurrency: 3})) {
    values.push(value);
  }

  expect(values).toEqual([0, 1, 2]);
  expect(started).toEqual([0, 1, 2]);
});

test('executeScanTasks propagates task errors', async () => {
  const tasks = toAsyncIterable([
    {
      run: async function* (): AsyncIterable<number> {
        yield 1;
        throw new Error('task failed');
      }
    }
  ]);

  await expect(collectValues(executeScanTasks(tasks))).rejects.toThrow('task failed');
});

test('executeScanTasks rejects invalid concurrency', async () => {
  await expect(
    collectValues(executeScanTasks(toAsyncIterable([]), {concurrency: 0}))
  ).rejects.toThrow('positive integer');
});

test('executeScanTasks preserves undefined values', async () => {
  const tasks = toAsyncIterable([
    {
      run: async function* (): AsyncIterable<undefined> {
        yield undefined;
      }
    }
  ]);

  await expect(collectValues(executeScanTasks(tasks))).resolves.toEqual([undefined]);
});

async function* toAsyncIterable<Value>(values: readonly Value[]): AsyncIterable<Value> {
  yield* values;
}

async function collectValues<Value>(values: AsyncIterable<Value>): Promise<Value[]> {
  const result: Value[] = [];
  for await (const value of values) result.push(value);
  return result;
}
