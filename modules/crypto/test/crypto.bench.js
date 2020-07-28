import {CryptoHashTransform, CRC32HashTransform, MD5HashTransform} from '@loaders.gl/crypto';
import {getBinaryData} from './lib/crypto-hash-transform.spec';
import * as CryptoJS from 'crypto-js';

export default async function csvBench(bench) {
  const {binaryData} = getBinaryData();

  bench = bench.group('Cryptographic Hash');

  bench = bench.addAsync('CRC32HashTransform#hash()', {multiplier: 100000, unit: 'bytes'}, () =>
    CRC32HashTransform.hash(binaryData)
  );

  bench = bench.addAsync('MD5HashTransform#hash(warmup)', {multiplier: 100000, unit: 'bytes'}, () =>
    MD5HashTransform.hash(binaryData)
  );

  bench = bench.addAsync('MD5HashTransform#hash()', {multiplier: 100000, unit: 'bytes'}, () =>
    MD5HashTransform.hash(binaryData)
  );

  bench = bench.add(
    'CryptoHashTransform#hashSync(SHA256)',
    {multiplier: 100000, unit: 'bytes'},
    () => CryptoHashTransform.hashSync(binaryData, {crypto: {algorithm: CryptoJS.algo.SHA256}})
  );

  bench = bench.addAsync('CryptoHashTransform#hash(MD5)', {multiplier: 100000, unit: 'bytes'}, () =>
    CryptoHashTransform.hash(binaryData)
  );

  return bench;
}
