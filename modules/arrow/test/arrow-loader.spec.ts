// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {validateLoader} from 'test/common/conformance';
import * as fs from 'fs';
import {ArrowLoader} from '@loaders.gl/arrow';
import {
  isBrowser,
  makeIterator,
  resolvePath,
  setLoaderOptions,
  fetchFile,
  parse,
  parseInBatches
} from '@loaders.gl/core';
import {
  ARROW_SIMPLE,
  ARROW_DICTIONARY,
  ARROW_STRUCT,
  ARROW_BIOGRID_NODES
} from './data/arrow/test-cases';
const ArrowWorkerLoader = ArrowLoader;
setLoaderOptions({
  _workerType: 'test'
});
test('ArrowLoader#loader conformance', () => {
  validateLoader(ArrowLoader, 'ArrowLoader');
});
test('ArrowLoader#parseSync(simple.arrow)', async () => {
  const arrowTable = await parse(fetchFile(ARROW_SIMPLE), ArrowLoader, {
    core: {worker: false}
  });
  // Check loader specific results
  expect(arrowTable.shape).toBe('columnar-table');
  if (arrowTable.shape === 'columnar-table') {
    expect(arrowTable.data.bar, 'bar column loaded').toBeTruthy();
    expect(arrowTable.data.baz, 'baz column loaded').toBeTruthy();
    expect(arrowTable.data.foo, 'foo column loaded').toBeTruthy();
  }
});
test('ArrowLoader#parseSync(simple.arrow) type="object-row-table"', async () => {
  const rowFormatTable = await parse(fetchFile(ARROW_SIMPLE), ArrowLoader, {
    core: {worker: false},
    arrow: {shape: 'object-row-table'}
  });
  expect(rowFormatTable.shape).toBe('object-row-table');
  if (rowFormatTable.shape === 'object-row-table') {
    expect(rowFormatTable, 'Row based table loaded').toBeTruthy();
    expect(rowFormatTable.data.length).toBe(5);
    expect(rowFormatTable.data[0]).toEqual({foo: 1, bar: 1, baz: 'aa'});
  }
});
test('ArrowLoader#parseSync(simple.arrow) supports core.shape', async () => {
  const rowFormatTable = await parse(fetchFile(ARROW_SIMPLE), ArrowLoader, {
    core: {worker: false, shape: 'object-row-table'}
  });
  expect(rowFormatTable.shape).toBe('object-row-table');
  if (rowFormatTable.shape === 'object-row-table') {
    expect(rowFormatTable.data.length).toBe(5);
    expect(rowFormatTable.data[0]).toEqual({foo: 1, bar: 1, baz: 'aa'});
  }
});
test('ArrowLoader#parseSync(simple.arrow) loader shape overrides core.shape', async () => {
  const rowFormatTable = await parse(fetchFile(ARROW_SIMPLE), ArrowLoader, {
    core: {worker: false, shape: 'array-row-table'},
    arrow: {shape: 'object-row-table'}
  });
  expect(rowFormatTable.shape).toBe('object-row-table');
});
// This table has a dictionary id that is not safe to represent as a JavaScript number.
// https://github.com/visgl/loaders.gl/pull/2632#issuecomment-1712001480
// https://github.com/apache/arrow/blob/f1d2fc92f9d898fc067d46a0d032d9b117a2d7fc/js/src/ipc/metadata/message.ts#L389
test('ArrowLoader#parseSync(dictionary.arrow)', async () => {
  const columnarTable = await parse(fetchFile(ARROW_DICTIONARY), ArrowLoader);
  expect(columnarTable.shape).toBe('columnar-table');
  if (columnarTable.shape === 'columnar-table') {
    expect(columnarTable.data['example-csv'], 'example-csv loaded').toBeTruthy();
  }
});
test('ArrowLoader#parse(fetchFile(struct).arrow)', async () => {
  const columns = await parse(fetchFile(ARROW_STRUCT), ArrowLoader);
  // Check loader specific results
  expect(columns.shape).toBe('columnar-table');
  if (columns.shape === 'columnar-table') {
    expect(columns.data.struct_nullable, 'struct_nullable loaded').toBeTruthy();
  }
});
// TODO - Arrow worker seems to not bundle apache arrow lib?
test('ArrowLoader#parse (WORKER)', async () => {
  if (!isBrowser) {
    console.log('Worker is not usable in non-browser environments');
    return;
  }
  const data = await parse(fetchFile(ARROW_SIMPLE), ArrowWorkerLoader);
  expect(data, 'Data returned').toBeTruthy();
});
test('ArrowLoader#parseInBatches(async input)', async () => {
  // TODO - parseInBatches should accept fetch response directly
  const response = await fetchFile(ARROW_BIOGRID_NODES);
  const data = await response.arrayBuffer();
  const asyncIterator = await parseInBatches(data, ArrowLoader);
  for await (const batch of asyncIterator) {
    expect(batch, 'received batch').toBeTruthy();
  }
});
// TODO - Move node stream test to generic parseInBatches test?
test('ArrowLoader#parseInBatches(Stream)', async () => {
  if (isBrowser) {
    console.log('Node stream test case only supported in Node');
    return;
  }
  const stream = fs.createReadStream(resolvePath(ARROW_BIOGRID_NODES));
  const asyncIterator = await parseInBatches(makeIterator(stream), ArrowLoader);
  for await (const batch of asyncIterator) {
    expect(batch, 'received batch').toBeTruthy();
  }
});
