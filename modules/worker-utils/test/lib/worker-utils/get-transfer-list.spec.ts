import {expect, test} from 'vitest';
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
test('getTransferList', () => {
  for (const testCase of TEST_CASES) {
    expect(getTransferList(testCase.input), testCase.title).toEqual(testCase.output);
  }
  if (messageChannel) {
    const testCase = {
      title: 'MessagePort',
      // @ts-ignore
      input: messageChannel,
      output: [messageChannel.port1, messageChannel.port2]
    };
    expect(getTransferList(testCase.input), testCase.title).toEqual(testCase.output);
  }
});
test('getTransferListForWriter - Should return empty object if object is null', async () => {
  const options = null;
  const transferableData = getTransferListForWriter(options);
  const expectedResult = {};
  expect(transferableData).toEqual(expectedResult);
});
test('getTransferListForWriter - Should return empty object if object is function', async () => {
  const options = {
    func: () => {}
  };
  const transferableData = getTransferListForWriter(options);
  const expectedResult = {func: {}};
  expect(transferableData).toEqual(expectedResult);
});
test('getTransferListForWriter - Should return empty object if object is RegExp', async () => {
  const options = {
    reg: /ab+c/i,
    regWithConstructor: new RegExp(/ab+c/, 'i')
  };
  const transferableData = getTransferListForWriter(options);
  const expectedResult = {reg: {}, regWithConstructor: {}};
  expect(transferableData).toEqual(expectedResult);
});
test('getTransferListForWriter - Should return new object', async () => {
  const options = {test: {test1: 'test1'}};
  const transferableData = getTransferListForWriter(options);
  const expectedResult = {test: {test1: 'test1'}};
  expect(transferableData).toEqual(expectedResult);
  expect(transferableData !== expectedResult).toBeTruthy();
  // @ts-expect-error
  expect(transferableData.test !== expectedResult.test).toBeTruthy();
});
test('getTransferListForWriter - Should keep typedArray as it is', async () => {
  const options = {
    typedOption: new Uint32Array([1, 2, 3, 4, 5])
  };
  const transferableData = getTransferListForWriter(options);
  const expectedResult = {typedOption: new Uint32Array([1, 2, 3, 4, 5])};
  expect(transferableData).toEqual(expectedResult);
});
test('getTransferListForWriter - Should handle hested options.', async () => {
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
  expect(transferableData).toEqual(expectedResult);
});
