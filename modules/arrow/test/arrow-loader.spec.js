import test from 'tape-promise/tape';
import {isBrowser, readFile, loadFile} from '@loaders.gl/core';
import {parseFileInBatches, parseFileInBatchesSync} from '@loaders.gl/core';
import {ArrowLoader} from '@loaders.gl/arrow';
import {ArrowWorkerLoader} from '@loaders.gl/arrow';
import path from 'path';

// Small Arrow Sample Files
const ARROW_SIMPLE = '@loaders.gl/arrow/test/data/simple.arrow';
const ARROW_DICTIONARY = '@loaders.gl/arrow/test/data/dictionary.arrow';
const ARROW_STRUCT = '@loaders.gl/arrow/test/data/struct.arrow';

// Bigger, batched sample file
const ARROW_BIOGRID_NODES = '@loaders.gl/arrow/test/data/biogrid-nodes.arrow';

test('ArrowLoader#parseFileSync(simple.arrow)', async t => {
  const columns = await loadFile(ARROW_SIMPLE, ArrowLoader);
  // Check loader specific results
  t.ok(columns.bar, 'bar column loaded');
  t.ok(columns.baz, 'baz column loaded');
  t.ok(columns.foo, 'foo column loaded');
  t.end();
});

test('ArrowLoader#parseFileSync(dictionary.arrow)', async t => {
  const columns = await loadFile(ARROW_DICTIONARY, ArrowLoader);
  // Check loader specific results
  t.ok(columns['example-csv'], 'example-csv loaded');
  t.end();
});

test('ArrowLoader#loadFile(struct.arrow)', async t => {
  const columns = await loadFile(ARROW_STRUCT, ArrowLoader);
  // Check loader specific results
  t.ok(columns.struct_nullable, 'struct_nullable loaded');
  t.end();
});

// TODO - Arrow worker seems to not bundle apache arrow lib?
test('ArrowLoader#parseFile (WORKER)', async t => {
  if (!isBrowser) {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  const data = await loadFile(ARROW_SIMPLE, ArrowWorkerLoader);
  t.ok(data, 'Data returned');
  t.end();
});

/*
test('ArrowLoader#parseFileInBatches(sync input)', async t => {
  const data = await readFile(ARROW_BIOGRID_NODES);

  const iterator = parseFileInBatchesSync(data, ArrowLoader);
  for (const batch of iterator) {
    t.ok(batch, 'received batch');
    t.end();
  }
});
*/

test('ArrowLoader#parseFileInBatches(async input)', async t => {
  const data = await readFile(ARROW_BIOGRID_NODES);

  const asyncIterator = await parseFileInBatches(data, ArrowLoader);
  for await (const batch of asyncIterator) {
    t.ok(batch, 'received batch');
    t.end();
  }
});

test('ArrowLoader#parseAsyncIterator(async input)', async t => {
  if (isBrowser) {
    t.comment('Stream test case currently only supported in Node');
    t.end();
    return;
  }
  const fs = require('fs');
  const data = fs.createReadStream(path.resolve(__dirname, './data/biogrid-nodes.arrow'));

  // const {Table} = require('apache-arrow');
  // const values = Table.from(data);

  const asyncIterator = await parseFileInBatches(data, ArrowLoader);
  for await (const batch of asyncIterator) {
    t.ok(batch, 'received batch');
    t.end();
  }
});
