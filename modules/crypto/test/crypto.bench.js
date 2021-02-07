import {
  CryptoHashTransform,
  CRC32HashTransform,
  CRC32CHashTransform,
  MD5HashTransform
} from '@loaders.gl/crypto';
import {getBinaryData} from './test-utils/test-utils';
import * as CryptoJS from 'crypto-js';

export default async function csvBench(bench) {
  const {binaryData} = getBinaryData();

  bench = bench.group('Cryptographic Hash');

  bench = bench.addAsync('CRC32HashTransform#run()', {multiplier: 100000, unit: 'bytes'}, () =>
    CRC32HashTransform.run(binaryData)
  );

  bench = bench.addAsync('CRC32CHashTransform#run()', {multiplier: 100000, unit: 'bytes'}, () =>
    CRC32CHashTransform.run(binaryData)
  );

  bench = bench.addAsync('MD5HashTransform#run(warmup)', {multiplier: 100000, unit: 'bytes'}, () =>
    MD5HashTransform.run(binaryData)
  );

  bench = bench.addAsync('MD5HashTransform#run()', {multiplier: 100000, unit: 'bytes'}, () =>
    MD5HashTransform.run(binaryData)
  );

  bench = bench.addAsync(
    'CryptoHashTransform#run(SHA256)',
    {multiplier: 100000, unit: 'bytes'},
    () =>
      CryptoHashTransform.run(binaryData, {
        modules: {CryptoJS},
        crypto: {algorithm: CryptoJS.algo.SHA256}
      })
  );

  bench = bench.addAsync('CryptoHashTransform#run(MD5)', {multiplier: 100000, unit: 'bytes'}, () =>
    CryptoHashTransform.run(binaryData, {modules: {CryptoJS}})
  );

  return bench;
}
