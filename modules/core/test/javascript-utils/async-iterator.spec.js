// https://jakearchibald.com/2017/async-iterators-and-generators/
import test from 'tape-promise/tape';

import {
  forEach,
  concatenateAsyncIterator,
  lineAsyncIterator,
  textDecoderAsyncIterator,
  textEncoderAsyncIterator,
  numberedLineAsyncIterator
} from '@loaders.gl/core/javascript-utils/async-iterator-utils';

/* global setTimeout */
const setTimeoutPromise = timeout => new Promise(resolve => setTimeout(resolve, timeout));

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
  return textEncoderAsyncIterator(asyncTexts());
}

test('async-iterator#forEach', async t => {
  t.plan(3);

  let iterations = 0;
  forEach(asyncNumbers(), number => {
    iterations++;
    t.is(number, iterations, `async iterating over ${number}`);
  });
});

test('async-iterator#concatenateAsyncIterator', async t => {
  const RESULT = `line 1\nline 2\nline 3\nline 4`;

  const text = await concatenateAsyncIterator(asyncTexts());
  t.is(text, RESULT, 'returns concatenated string');

  const arraybuffer = await concatenateAsyncIterator(asyncArrayBuffers());
  t.ok(arraybuffer instanceof Uint8Array, 'returns buffer');
  /* global TextEncoder */
  t.deepEqual(arraybuffer, new TextEncoder().encode(RESULT), 'returns concatenated arraybuffer');

  t.end();
});

test('async-iterator#textDecoderAsyncIterator', async t => {
  t.plan(6);

  for await (const text of textDecoderAsyncIterator(asyncTexts())) {
    t.comment(text);
    t.ok(typeof text === 'string', 'async iterator yields string');
  }

  for await (const text of textDecoderAsyncIterator(asyncArrayBuffers())) {
    t.comment(text);
    t.ok(typeof text === 'string', 'async iterator yields string');
  }
});

test('async-iterator#lineAsyncIterator', async t => {
  t.plan(4);

  let iterations = 0;
  for await (const text of lineAsyncIterator(asyncTexts())) {
    iterations++;
    t.is(text.trim(), `line ${iterations}`, 'yields single line');
  }
});

test('async-iterator#numberedLineAsyncIterator', async t => {
  t.plan(8);

  let iterations = 0;
  for await (const result of numberedLineAsyncIterator(lineAsyncIterator(asyncTexts()))) {
    iterations++;
    t.is(result.line.trim(), `line ${iterations}`, 'line text');
    t.is(result.counter, iterations, 'line counter');
  }
});
