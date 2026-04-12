// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {processOnWorker, isBrowser, WorkerFarm} from '@loaders.gl/worker-utils';
import {CryptoWorker, CryptoJSWorker} from '@loaders.gl/crypto';
import {getBinaryData} from './test-utils/test-utils';

test('CryptoWorker', async () => {
  const {binaryData} = getBinaryData();

  expect(binaryData.byteLength, 'Length correct').toBe(100000);

  let hash = await processOnWorker(CryptoWorker, binaryData.slice(0), {
    operation: 'crc32',
    _workerType: 'test'
  });

  expect(hash, 'CRC32 Hash correct').toBe('khuskQ==');

  hash = await processOnWorker(CryptoWorker, binaryData.slice(0), {
    operation: 'crc32c',
    workerLocation: 'test'
  });

  expect(hash, 'CRC32c Hash correct').toBe('PDGE8A==');

  hash = await processOnWorker(CryptoWorker, binaryData.slice(0), {
    operation: 'md5',
    _workerType: 'test'
  });

  expect(hash, 'MD5 Hash correct').toBe('YnxTb+lyen1CsNkpmLv+qA==');

  // Destroy all workers in NodeJS
  if (!isBrowser) {
    const workerFarm = WorkerFarm.getWorkerFarm({});
    workerFarm.destroy();
  }
});

// CryptoJSWorker is disabled
test.skip('CryptoJSWorker', async () => {
  if (!isBrowser) {
    return;
  }

  const {binaryData} = getBinaryData();

  expect(binaryData.byteLength, 'Length correct').toBe(100000);

  let hash = await processOnWorker(CryptoJSWorker, binaryData.slice(0), {
    operation: 'crc32',
    _workerType: 'test'
  });

  expect(hash, 'CRC32 Hash correct').toBe('beRTbw==');

  hash = await processOnWorker(CryptoJSWorker, binaryData.slice(0), {
    operation: 'crc32c',
    _workerType: 'test'
  });

  expect(hash, 'CRC32c Hash correct').toBe('==');

  hash = await processOnWorker(CryptoJSWorker, binaryData.slice(0), {
    operation: 'md5',
    _workerType: 'test'
  });

  expect(hash, 'CRC32c Hash correct').toBe('==');
});
