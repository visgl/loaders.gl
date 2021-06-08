import test from 'tape-promise/tape';
import {processOnWorker, isBrowser} from '@loaders.gl/worker-utils';
import {CryptoWorker, CryptoJSWorker} from '@loaders.gl/crypto';
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

test('CryptoWorker', async (t) => {
  if (!isBrowser) {
    t.end();
    return;
  }

  const {binaryData} = getData();

  t.equal(binaryData.byteLength, 100000, 'Length correct');

  let hash = await processOnWorker(CryptoWorker, binaryData.slice(), {
    operation: 'crc32',
    _workerType: 'test'
  });

  t.equal(hash, 'beRTbw==', 'CRC32 Hash correct');

  hash = await processOnWorker(CryptoWorker, binaryData.slice(), {
    operation: 'crc32c',
    workerLocation: 'test'
  });

  t.equal(hash, 'PDGE8A==', 'CRC32c Hash correct');

  hash = await processOnWorker(CryptoWorker, binaryData.slice(), {
    operation: 'md5',
    _workerType: 'test'
  });

  t.equal(hash, 'YnxTb+lyen1CsNkpmLv+qA==', 'MD5 Hash correct');

  t.end();
});

test.skip('CryptoJSWorker', async (t) => {
  if (!isBrowser) {
    t.end();
    return;
  }

  const {binaryData} = getData();

  t.equal(binaryData.byteLength, 100000, 'Length correct');

  let hash = await processOnWorker(CryptoJSWorker, binaryData.slice(), {
    operation: 'crc32',
    _workerType: 'test'
  });

  t.equal(hash, 'beRTbw==', 'CRC32 Hash correct');

  hash = await processOnWorker(CryptoJSWorker, binaryData.slice(), {
    operation: 'crc32c',
    _workerType: 'test'
  });

  t.equal(hash, '==', 'CRC32c Hash correct');

  hash = await processOnWorker(CryptoJSWorker, binaryData.slice(), {
    operation: 'md5',
    _workerType: 'test'
  });

  t.equal(hash, '==', 'CRC32c Hash correct');

  t.end();
});
