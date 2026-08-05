// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {isBrowser} from '@loaders.gl/loader-utils';
import {makeStreamIterator} from '../src/lib/utils/make-stream-iterator';

test('Parquet makeStreamIterator#rethrows read errors and releases the lock', async t => {
  if (!isBrowser) {
    t.comment('Browser-only stream lock behavior');
    t.end();
    return;
  }

  const readError = new Error('Stream read failed');
  const stream = new ReadableStream<number>({
    start(controller) {
      controller.error(readError);
    }
  });

  await t.rejects(collectValues(makeStreamIterator(stream)), readError, 'preserves the read error');
  t.notOk(stream.locked, 'releases the reader lock');
  t.end();
});

test('Parquet makeStreamIterator#cancels and unlocks on early return', async t => {
  if (!isBrowser) {
    t.comment('Browser-only stream lock behavior');
    t.end();
    return;
  }

  let cancellationCount = 0;
  const stream = new ReadableStream<number>({
    start(controller) {
      controller.enqueue(1);
    },
    cancel() {
      cancellationCount++;
    }
  });

  for await (const value of makeStreamIterator(stream, {_streamReadAhead: true})) {
    t.equal(value, 1, 'reads the first value');
    break;
  }

  t.equal(cancellationCount, 1, 'cancels the unfinished stream');
  t.notOk(stream.locked, 'releases the reader lock');
  t.end();
});

test('Parquet makeStreamIterator#unlocks after natural completion', async t => {
  if (!isBrowser) {
    t.comment('Browser-only stream lock behavior');
    t.end();
    return;
  }

  const stream = new ReadableStream<number>({
    start(controller) {
      controller.enqueue(1);
      controller.close();
    }
  });

  t.deepEqual(await collectValues(makeStreamIterator(stream)), [1], 'reads every value');
  t.notOk(stream.locked, 'releases the reader lock');
  t.end();
});

test('Parquet makeStreamIterator#aborts a pending read and releases the stream', async t => {
  const abortController = new AbortController();
  const abortReason = new Error('Stop reading Parquet data');
  let cancellationCount = 0;
  const stream = new ReadableStream<number>({
    cancel() {
      cancellationCount++;
    }
  });

  const valuesPromise = collectValues(
    makeStreamIterator(stream, {signal: abortController.signal})
  );
  await Promise.resolve();
  abortController.abort(abortReason);

  await t.rejects(valuesPromise, abortReason, 'rejects with the AbortSignal reason');
  t.equal(cancellationCount, 1, 'cancels the pending stream');
  t.notOk(stream.locked, 'releases the reader or async-iterator lock');
  t.end();
});

async function collectValues<T>(values: AsyncIterable<T>): Promise<T[]> {
  const collectedValues: T[] = [];
  for await (const value of values) {
    collectedValues.push(value);
  }
  return collectedValues;
}
