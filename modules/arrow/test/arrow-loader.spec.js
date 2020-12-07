/* global BigInt, BigInt64Array, BigUint64Array */
import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {ArrowLoader, ArrowWorkerLoader, ArrowWriter, VECTOR_TYPES} from '@loaders.gl/arrow';
import {isBrowser, makeIterator, resolvePath} from '@loaders.gl/core';
import {
  setLoaderOptions,
  fetchFile,
  parse,
  parseSync,
  parseInBatches,
  encodeSync
} from '@loaders.gl/core';

// Small Arrow Sample Files
const ARROW_SIMPLE = '@loaders.gl/arrow/test/data/simple.arrow';
const ARROW_DICTIONARY = '@loaders.gl/arrow/test/data/dictionary.arrow';
const ARROW_STRUCT = '@loaders.gl/arrow/test/data/struct.arrow';
const ARROW_H3 = '@loaders.gl/arrow/test/data/test_h3.feather';

// Bigger, batched sample file
const ARROW_BIOGRID_NODES = '@loaders.gl/arrow/test/data/biogrid-nodes.arrow';

setLoaderOptions({
  arrow: {
    workerUrl: 'modules/arrow/dist/arrow-loader.worker.js'
  }
});

test('ArrowLoader#loader conformance', t => {
  validateLoader(t, ArrowLoader, 'ArrowLoader');
  t.end();
});

test('ArrowLoader#parseSync(simple.arrow)', async t => {
  const columns = await parse(fetchFile(ARROW_SIMPLE), ArrowLoader, {worker: false});
  // Check loader specific results
  t.ok(columns.bar, 'bar column loaded');
  t.ok(columns.baz, 'baz column loaded');
  t.ok(columns.foo, 'foo column loaded');
  t.end();
});

test('ArrowLoader#parseSync(dictionary.arrow)', async t => {
  const columns = await parse(fetchFile(ARROW_DICTIONARY), ArrowLoader);
  // Check loader specific results
  t.ok(columns['example-csv'], 'example-csv loaded');
  t.end();
});

test('ArrowLoader#parse(fetchFile(struct).arrow)', async t => {
  const columns = await parse(fetchFile(ARROW_STRUCT), ArrowLoader);
  // Check loader specific results
  t.ok(columns.struct_nullable, 'struct_nullable loaded');
  t.end();
});

// TODO - Arrow worker seems to not bundle apache arrow lib?
test('ArrowLoader#parse (WORKER)', async t => {
  if (!isBrowser) {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  const data = await parse(fetchFile(ARROW_SIMPLE), ArrowWorkerLoader);
  t.ok(data, 'Data returned');
  t.end();
});

test('ArrowLoader#parseInBatches(async input)', async t => {
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
test('ArrowLoader#parseInBatches(Stream)', async t => {
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

test('ArrowLoader#parse(H3 indices)', async t => {
  const columns = await parse(fetchFile(ARROW_H3), ArrowLoader, {worker: false});
  // Check loader specific results
  t.ok(columns.h3, 'h3 column loaded');
  t.equal(columns.h3.length, 7);

  t.deepEquals(bigInt64ArrayToHexStringArray(columns.h3), [
    '862834707ffffff',
    '86283470fffffff',
    '862834717ffffff',
    '86283471fffffff',
    '862834727ffffff',
    '86283472fffffff',
    '862834737ffffff'
  ]);
  t.end();
});

test('ArrowLoader#parse (big number vectors)', async t => {
  const testNumber = BigInt(Number.MAX_SAFE_INTEGER);
  const testUintNumber = testNumber + BigInt(99999);
  const testFloat = 13445.123456737;
  const testBigInt64Array = new BigInt64Array([testNumber]);
  const testBigUint64Array = new BigUint64Array([testUintNumber]);
  const testFloat64Array = new Float64Array([testFloat]);
  const testFloat32Array = new Float32Array([testFloat]);

  const arraysData = [
    {array: testBigInt64Array, name: 'testBigInt64Array', type: VECTOR_TYPES.Int},
    {array: testBigUint64Array, name: 'testBigUint64Array', type: VECTOR_TYPES.Int},
    {array: testFloat64Array, name: 'testFloat64Array', type: VECTOR_TYPES.Float},
    {array: testFloat32Array, name: 'testFloat32Array', type: VECTOR_TYPES.Float}
  ];
  const arrayBuffer = encodeSync(arraysData, ArrowWriter);

  const table = parseSync(arrayBuffer, ArrowLoader);

  t.ok(table);

  t.equal(table.testBigInt64Array.length, 2); // It's bug of Arrow lib, it should be 1
  t.equal(table.testBigUint64Array.length, 2); // It's bug of Arrow lib, it should be 1

  t.deepEqual(table.testBigInt64Array, {0: testNumber, 1: BigInt(0)});
  t.deepEqual(table.testBigUint64Array, {0: testUintNumber, 1: BigInt(0)});
  t.deepEqual(table.testFloat64Array, {0: testFloat}, 'Float64Array keeps precision');
  t.notEqual(table.testFloat32Array[0], testFloat, "Float32Array number can't keep precision");

  t.end();
});

function bigInt64ArrayToHexStringArray(bigInt64Array) {
  const result = [];
  for (const value of bigInt64Array) {
    result.push(value.toString(16));
  }
  return result;
}
