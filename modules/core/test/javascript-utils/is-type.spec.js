import test from 'tape-promise/tape';

import {
  // isPromise,
  // isIterable,
  // isAsyncIterable,
  isIterator
  // isResponse,
  // isReadableStream,
  // isWritableStream
} from '@loaders.gl/core';

test('isIterator', (t) => {
  const TESTS = [
    {
      input: new Set().entries(),
      output: true
    },
    {
      input: [].entries(),
      output: true
    },
    {
      input: (function* generator() {
        yield 1;
      })(),
      output: true
    },
    {
      input: [],
      output: false
    },
    {
      input: null,
      output: null
    }
  ];

  for (const testCase of TESTS) {
    t.is(
      isIterator(testCase.input),
      testCase.output,
      `${testCase.output ? 'shoud' : 'should not'} be iterator`
    );
  }

  t.end();
});
