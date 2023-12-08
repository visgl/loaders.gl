// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {getTransferList, getTransferListForWriter} from '@loaders.gl/worker-utils';

const typedArray = new Uint8Array(4);
const typedArray2 = new Float32Array(typedArray.buffer);
const messageChannel = typeof MessageChannel !== 'undefined' && new MessageChannel();

const TEST_CASES = [
  {
    title: 'empty',
    input: null,
    output: []
  },
  {
    title: 'plain JS object',
    input: {a: 1, b: 2},
    output: []
  },
  {
    title: 'ArrayBuffer',
    input: typedArray.buffer,
    output: [typedArray.buffer]
  },
  {
    title: 'TypedArray',
    input: {result: {data: typedArray}},
    output: [typedArray.buffer]
  },
  {
    title: 'TypedArrays with same underlying buffer',
    input: [typedArray, typedArray2],
    output: [typedArray.buffer]
  }
];

test('getTransferList', (t) => {
  for (const testCase of TEST_CASES) {
    t.deepEqual(getTransferList(testCase.input), testCase.output, testCase.title);
  }

  if (messageChannel) {
    const testCase = {
      title: 'MessagePort',
      // @ts-ignore
      input: messageChannel,
      output: [messageChannel.port1, messageChannel.port2]
    };
    t.deepEqual(getTransferList(testCase.input), testCase.output, testCase.title);
  }

  t.end();
});

test('getTransferListForWriter - Should return empty object if object is null', async (t) => {
  const options = null;

  const transferableData = getTransferListForWriter(options);

  const expectedResult = {};

  t.deepEqual(transferableData, expectedResult);
  t.end();
});

test('getTransferListForWriter - Should return empty object if object is function', async (t) => {
  const options = {
    func: () => {}
  };

  const transferableData = getTransferListForWriter(options);

  const expectedResult = {func: {}};

  t.deepEqual(transferableData, expectedResult);
  t.end();
});

test('getTransferListForWriter - Should return empty object if object is RegExp', async (t) => {
  const options = {
    reg: /ab+c/i,
    regWithConstructor: new RegExp(/ab+c/, 'i')
  };

  const transferableData = getTransferListForWriter(options);

  const expectedResult = {reg: {}, regWithConstructor: {}};

  t.deepEqual(transferableData, expectedResult);
  t.end();
});

test('getTransferListForWriter - Should return new object', async (t) => {
  const options = {test: {test1: 'test1'}};

  const transferableData = getTransferListForWriter(options);

  const expectedResult = {test: {test1: 'test1'}};

  t.deepEqual(transferableData, expectedResult);
  t.ok(transferableData !== expectedResult);
  // @ts-expect-error
  t.ok(transferableData.test !== expectedResult.test);
  t.end();
});

test('getTransferListForWriter - Should keep typedArray as it is', async (t) => {
  const options = {
    typedOption: new Uint32Array([1, 2, 3, 4, 5])
  };

  const transferableData = getTransferListForWriter(options);

  const expectedResult = {typedOption: new Uint32Array([1, 2, 3, 4, 5])};

  t.deepEqual(transferableData, expectedResult);
  t.end();
});

test('getTransferListForWriter - Should handle hested options.', async (t) => {
  const options = {
    one: {
      two: {
        three: 'first neseted option'
      }
    },
    four: {
      five: () => {}
    },
    six: {
      deep: {
        typed: new Uint32Array([1, 2, 3, 4, 5])
      }
    }
  };

  const transferableData = getTransferListForWriter(options);

  const expectedResult = {
    one: {
      two: {
        three: 'first neseted option'
      }
    },
    four: {
      five: {}
    },
    six: {
      deep: {
        typed: new Uint32Array([1, 2, 3, 4, 5])
      }
    }
  };

  t.deepEqual(transferableData, expectedResult);
  t.end();
});
