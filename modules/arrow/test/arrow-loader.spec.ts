import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {ArrowLoader} from '@loaders.gl/arrow';
import {isBrowser, makeIterator, resolvePath} from '@loaders.gl/core';
import {setLoaderOptions, fetchFile, parse, parseInBatches} from '@loaders.gl/core';

const ArrowWorkerLoader = ArrowLoader;

// Small Arrow Sample Files
const ARROW_SIMPLE = '@loaders.gl/arrow/test/data/simple.arrow';
const ARROW_DICTIONARY = '@loaders.gl/arrow/test/data/dictionary.arrow';
const ARROW_STRUCT = '@loaders.gl/arrow/test/data/struct.arrow';

// Bigger, batched sample file
const ARROW_BIOGRID_NODES = '@loaders.gl/arrow/test/data/biogrid-nodes.arrow';

setLoaderOptions({
  _workerType: 'test'
});

test('ArrowLoader#loader conformance', (t) => {
  validateLoader(t, ArrowLoader, 'ArrowLoader');
  t.end();
});

test('ArrowLoader#parseSync(simple.arrow)', async (t) => {
  const arrowTable = await parse(fetchFile(ARROW_SIMPLE), ArrowLoader, {worker: false});
  // Check loader specific results
  t.equal(arrowTable.shape, 'columnar-table');
  if (arrowTable.shape === 'columnar-table') {
    t.ok(arrowTable.data.bar, 'bar column loaded');
    t.ok(arrowTable.data.baz, 'baz column loaded');
    t.ok(arrowTable.data.foo, 'foo column loaded');
  }
  t.end();
});

test('ArrowLoader#parseSync(simple.arrow) type="object-row-table"', async (t) => {
  const rowFormatTable = await parse(fetchFile(ARROW_SIMPLE), ArrowLoader, {
    worker: false,
    arrow: {
      shape: 'object-row-table'
    }
  });
  t.equal(rowFormatTable.shape, 'object-row-table');
  if (rowFormatTable.shape === 'object-row-table') {
    t.ok(rowFormatTable, 'Row based table loaded');
    t.equal(rowFormatTable.data.length, 5);
    t.deepEqual(rowFormatTable.data[0], {foo: 1, bar: 1, baz: 'aa'});
  }
  t.end();
});

test('ArrowLoader#parseSync(dictionary.arrow)', async (t) => {
  const columnarTable = await parse(fetchFile(ARROW_DICTIONARY), ArrowLoader);
  // Check loader specific results
  t.ok(columnarTable.data['example-csv'], 'example-csv loaded');
  t.end();
});

test('ArrowLoader#parse(fetchFile(struct).arrow)', async (t) => {
  const columns = await parse(fetchFile(ARROW_STRUCT), ArrowLoader);
  // Check loader specific results
  t.equal(columns.shape, 'columnar-table');
  if (columns.shape === 'columnar-table') {
    t.ok(columns.data.struct_nullable, 'struct_nullable loaded');
  }
  t.end();
});

// TODO - Arrow worker seems to not bundle apache arrow lib?
test('ArrowLoader#parse (WORKER)', async (t) => {
  if (!isBrowser) {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  const data = await parse(fetchFile(ARROW_SIMPLE), ArrowWorkerLoader);
  t.ok(data, 'Data returned');
  t.end();
});

test('ArrowLoader#parseInBatches(async input)', async (t) => {
  // TODO - parseInBatches should accept fetch response directly
  const response = await fetchFile(ARROW_BIOGRID_NODES);
  const data = await response.arrayBuffer();
  const asyncIterator = await parseInBatches(data, ArrowLoader);
  for await (const batch of asyncIterator) {
    t.ok(batch, 'received batch');
  }
  t.end();
});

// TODO - Move node stream test to generic parseInBatches test?
test('ArrowLoader#parseInBatches(Stream)', async (t) => {
  if (isBrowser) {
    t.comment('Node stream test case only supported in Node');
    t.end();
    return;
  }
  const fs = require('fs');
  const stream = fs.createReadStream(resolvePath(ARROW_BIOGRID_NODES));
  const asyncIterator = await parseInBatches(makeIterator(stream), ArrowLoader);
  for await (const batch of asyncIterator) {
    t.ok(batch, 'received batch');
  }
  t.end();
});
