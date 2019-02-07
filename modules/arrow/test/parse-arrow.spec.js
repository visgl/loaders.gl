/* eslint-disable max-len */
/*
import test from 'tape-catch';
<<<<<<< HEAD
import {loadBinaryFile} from '@loaders.gl/core-node';
import {parseFileSync} from '@loaders.gl/core';
import {ArrowLoader} from '@loaders.gl/arrow';
// import {ArrowLoader, ArrowWorkerLoader} from '@loaders.gl/arrow';
import path from 'path';

// Small Arrow Sample Files
const ARROW_SIMPLE =
  loadFileSync(path.resolve(__dirname, '../data/simple.arrow')) ||
  require('../data/simple.arrow');

const ARROW_DICTIONARY =
  loadFileSync(path.resolve(__dirname, '../data/dictionary.arrow')) ||
  require('../data/dictionary.arrow');

test('ArrowLoader#parseFileSync(simple.arrow)', t => {
  const columns = parseFileSync(ARROW_SIMPLE, 'simple.arrow', ArrowLoader);
  // Check loader specific results
  t.ok(columns.bar, 'bar column loaded');
  t.ok(columns.baz, 'baz column loaded');
  t.ok(columns.foo, 'foo column loaded');
  t.end();
});

test('ArrowLoader#parseFileSync(dictionary.arrow)', t => {
  const columns = parseFileSync(ARROW_DICTIONARY, 'dictionary.arrow', ArrowLoader);
  // Check loader specific results
  t.ok(columns['example-csv'], 'example-csv loaded');
  t.end();
});

test('ArrowLoader#parseFileSync(struct.arrow)', t => {
  const columns = parseFileSync(ARROW_STRUCT, 'struct.arrow', ArrowLoader);
  // Check loader specific results
  t.ok(columns.struct_nullable, 'struct_nullable loaded');
  t.end();
});

// TODO - Arrow worker seems to not bundle apache arrow lib?
test('ArrowLoader#parseWithWorker (WORKER)', t => {
  if (typeof Worker === 'undefined') {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  // Once binary is transferred to worker it cannot be read from the main thread
  // Duplicate it here to avoid breaking other tests
  const testData = ARROW_SIMPLE.slice();
  parseWithWorker(ArrowLoader.worker)(testData).then(data => {
    // Check loader specific results
    t.ok(data, 'Data returned');
  }).catch(error => {
    t.fail(error);
  }).then(t.end);
});
*/
