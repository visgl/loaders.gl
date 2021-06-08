import test from 'tape-promise/tape';
import {getTransferList} from '@loaders.gl/worker-utils/lib/worker-farm/get-transfer-list';

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
