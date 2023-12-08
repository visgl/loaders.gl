// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {processOnWorker, isBrowser, WorkerFarm} from '@loaders.gl/worker-utils';
import {CryptoWorker, CryptoJSWorker} from '@loaders.gl/crypto';
import {getBinaryData} from './test-utils/test-utils';

test('CryptoWorker', async (t) => {
  const {binaryData} = getBinaryData();

  t.equal(binaryData.byteLength, 100000, 'Length correct');

  let hash = await processOnWorker(CryptoWorker, binaryData.slice(0), {
    operation: 'crc32',
    _workerType: 'test'
  });

  t.equal(hash, 'khuskQ==', 'CRC32 Hash correct');

  hash = await processOnWorker(CryptoWorker, binaryData.slice(0), {
    operation: 'crc32c',
    workerLocation: 'test'
  });

  t.equal(hash, 'PDGE8A==', 'CRC32c Hash correct');

  hash = await processOnWorker(CryptoWorker, binaryData.slice(0), {
    operation: 'md5',
    _workerType: 'test'
  });

  t.equal(hash, 'YnxTb+lyen1CsNkpmLv+qA==', 'MD5 Hash correct');

  // Destroy all workers in NodeJS
  if (!isBrowser) {
    const workerFarm = WorkerFarm.getWorkerFarm({});
    workerFarm.destroy();
  }

  t.end();
});

// CryptoJSWorker is disabled
test.skip('CryptoJSWorker', async (t) => {
  if (!isBrowser) {
    t.end();
    return;
  }

  const {binaryData} = getBinaryData();

  t.equal(binaryData.byteLength, 100000, 'Length correct');

  let hash = await processOnWorker(CryptoJSWorker, binaryData.slice(0), {
    operation: 'crc32',
    _workerType: 'test'
  });

  t.equal(hash, 'beRTbw==', 'CRC32 Hash correct');

  hash = await processOnWorker(CryptoJSWorker, binaryData.slice(0), {
    operation: 'crc32c',
    _workerType: 'test'
  });

  t.equal(hash, '==', 'CRC32c Hash correct');

  hash = await processOnWorker(CryptoJSWorker, binaryData.slice(0), {
    operation: 'md5',
    _workerType: 'test'
  });

  t.equal(hash, '==', 'CRC32c Hash correct');

  t.end();
});
