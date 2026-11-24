// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {CRC32Hash} from '@loaders.gl/crypto/crc32';
import {CRC32CHash} from '@loaders.gl/crypto/crc32c';
import {MD5Hash} from '@loaders.gl/crypto/md5';
import {SHA256Hash} from '@loaders.gl/crypto/sha256';
import {CryptoHash} from '@loaders.gl/crypto/webcrypto';
import {getBinaryData} from './test-utils/test-utils';
import CryptoJS from 'crypto-js';

export default async function cryptoBench(bench) {
  const {binaryData} = getBinaryData();

  bench = bench.group('Cryptographic Hash');

  bench = bench.addAsync('CRC32Hash#hash()', {multiplier: 100000, unit: 'bytes'}, () =>
    new CRC32Hash().hash(binaryData, 'base64')
  );

  bench = bench.addAsync('CRC32CHash#hash()', {multiplier: 100000, unit: 'bytes'}, () =>
    new CRC32CHash().hash(binaryData, 'base64')
  );

  bench = bench.addAsync('MD5Hash#hash(warmup)', {multiplier: 100000, unit: 'bytes'}, () =>
    new MD5Hash().hash(binaryData, 'base64')
  );

  bench = bench.addAsync('MD5Hash#hash()', {multiplier: 100000, unit: 'bytes'}, () =>
    new MD5Hash().hash(binaryData, 'base64')
  );

  bench = bench.addAsync('CryptoHash(MD5)#hash()', {multiplier: 100000, unit: 'bytes'}, () =>
    new CryptoHash({modules: {CryptoJS}, crypto: {algorithm: 'MD5'}}).hash(binaryData, 'base64')
  );

  bench = bench.addAsync('SHA256Hash#hash()', {multiplier: 100000, unit: 'bytes'}, () =>
    new SHA256Hash({modules: {CryptoJS}}).hash(binaryData, 'base64')
  );

  return bench;
}
