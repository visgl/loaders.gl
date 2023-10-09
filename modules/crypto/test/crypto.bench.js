import {CRC32Hash, CRC32CHash, MD5Hash, SHA256Hash, CryptoHash} from '@loaders.gl/crypto';
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
