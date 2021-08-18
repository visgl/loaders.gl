// https://jakearchibald.com/2017/async-iterators-and-generators/
import test from 'tape-promise/tape';

import {
  forEach,
  makeTextDecoderIterator,
  makeTextEncoderIterator,
  makeLineIterator,
  makeNumberedLineIterator
} from '@loaders.gl/loader-utils';

import parseNDJSONInBatches from '@loaders.gl/json/lib/parse-ndjson-in-batches';

const setTimeoutPromise = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout));

async function* asyncNumbers() {
  let number = 0;
  for (let i = 0; i < 3; i++) {
    await setTimeoutPromise(10);
    number += 1;
    yield number;
  }
}

async function* asyncTexts() {
  await setTimeoutPromise(10);
  yield 'line 1\nline';
  await setTimeoutPromise(10);
  yield ' 2\nline 3\n';
  await setTimeoutPromise(10);
  yield 'line 4';
}

function asyncArrayBuffers() {
  return makeTextEncoderIterator(asyncTexts());
}

async function* asyncJsons() {
  await setTimeoutPromise(10);
  yield '{"id":0,"field":"value0","flag":false}\n{"id":1,"fie';
  await setTimeoutPromise(10);
  yield 'ld":"value1","flag":true}\n{"id":2,"field":"value2","flag":false}\n';
  await setTimeoutPromise(10);
  yield '{"id":3,"field":"value3","flag":true}';
}

function asyncNDJson() {
  return makeTextEncoderIterator(asyncJsons());
}

test('async-iterator#forEach', async (t) => {
  t.plan(3);

  let iterations = 0;
  forEach(asyncNumbers(), (number) => {
    iterations++;
    t.is(number, iterations, `async iterating over ${number}`);
  });
});

test('async-iterator#makeTextDecoderIterator', async (t) => {
  t.plan(6);

  for await (const text of asyncTexts()) {
    t.comment(text);
    t.ok(typeof text === 'string', 'async iterator yields string');
  }

  for await (const text of makeTextDecoderIterator(asyncArrayBuffers())) {
    t.comment(text);
    t.ok(typeof text === 'string', 'async iterator yields string');
  }
});

test('async-iterator#makeLineIterator', async (t) => {
  t.plan(4);

  let iterations = 0;
  for await (const text of makeLineIterator(asyncTexts())) {
    iterations++;
    t.is(text.trim(), `line ${iterations}`, 'yields single line');
  }
});

test('async-iterator#makeNumberedLineIterator', async (t) => {
  t.plan(8);

  let iterations = 0;
  for await (const result of makeNumberedLineIterator(makeLineIterator(asyncTexts()))) {
    iterations++;
    t.is(result.line.trim(), `line ${iterations}`, 'line text');
    t.is(result.counter, iterations, 'line counter');
  }
});

test('async-iterator#parseNDJSONInBatches', async (t) => {
  let id = 0;
  for await (const obj of parseNDJSONInBatches(asyncNDJson())) {
    t.equals(typeof obj, 'object', 'async iterator yields object');
    t.equals(obj['id'], id, 'id property matches');
    t.equals(obj['field'], `value${id}`, 'field property matches');
    t.equals(obj['flag'], Boolean(id % 2), 'flag field matches');
    id++;
  }
});
