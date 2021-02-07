import test from 'tape-promise/tape';
import {processOnWorker, isBrowser} from '@loaders.gl/worker-utils';
import {CRC32Worker} from '@loaders.gl/crypto';
import {generateRandomArrayBuffer} from './test-utils/test-utils';

const SIZE = 100 * 1000;
const data = null;

// Avoid creating data in global scope
function getData() {
  if (data) {
    return data;
  }
  return {
    binaryData: generateRandomArrayBuffer({size: SIZE}),
    repeatedData: generateRandomArrayBuffer({size: SIZE / 10, repetitions: 10})
  };
}

test('crc32#worker', async t => {
  if (!isBrowser) {
    t.end();
    return;
  }

  const {binaryData} = getData();

  t.equal(binaryData.byteLength, 100000, 'Length correct');

  let hash = await processOnWorker(CRC32Worker, binaryData.slice(), {
    operation: 'crc32',
    crc32: {
      workerUrl: 'test'
    }
  });

  t.equal(hash, 'beRTbw==', 'CRC32 Hash correct');

  hash = await processOnWorker(CRC32Worker, binaryData.slice(), {
    operation: 'crc32c',
    crc32: {
      workerUrl: 'test'
    }
  });

  t.equal(hash, '==', 'CRC32c Hash correct');

  t.end();
});
