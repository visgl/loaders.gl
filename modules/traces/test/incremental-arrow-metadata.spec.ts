// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {makeArrowTableFromBatches} from '@loaders.gl/core/schema-utils';
import {
  parseChromeTraceToArrowRecordBatches,
  parseChromeTraceToArrowTable
} from '../src/chrome-trace-arrow-parser';

test('Chrome Trace emits rows immediately and a final metadata-only refinement', async () => {
  const prefix = '{"traceEvents":[{"name":"first","ph":"i","pid":1,"tid":1},';
  const suffix =
    '{"name":"second","ph":"i","pid":1,"tid":1}],"displayTimeUnit":"ms","metadata":{"source":"test"},"custom":"preserved"}';
  let consumedSuffix = false;
  /** Supplies the metadata suffix only after the first batch is consumed. */
  async function* source() {
    yield prefix;
    consumedSuffix = true;
    yield suffix;
  }
  const iterable = parseChromeTraceToArrowRecordBatches(source(), {batchSize: 1});
  const iterator = iterable[Symbol.asyncIterator]();
  const first = (await iterator.next()).value!;
  expect(consumedSuffix).toBe(false);
  expect(first.numRows).toBe(1);
  const initialMetadata = [...first.schema.metadata];
  const batches = [first];
  for await (const batch of iterable) batches.push(batch);
  expect(batches.at(-1)!.numRows).toBe(0);
  expect([...first.schema.metadata]).toEqual(initialMetadata);
  const table = (await makeArrowTableFromBatches(batches))!;
  expect(table.numRows).toBe(2);
  expect(Object.fromEntries(table.schema.metadata)).toEqual(
    Object.fromEntries(parseChromeTraceToArrowTable(prefix + suffix).schema.metadata)
  );
});

test('Empty Chrome Trace batches retain declared schema and container metadata', async () => {
  const table = await makeArrowTableFromBatches(
    parseChromeTraceToArrowRecordBatches(['{"traceEvents":[],"metadata":{"source":"empty"}}'])
  );
  expect(table!.numRows).toBe(0);
  expect(table!.numCols).toBeGreaterThan(0);
  expect(table!.schema.metadata.get('chromeTrace.metadataJson')).toBe('{"source":"empty"}');
});
