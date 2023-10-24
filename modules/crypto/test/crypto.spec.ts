// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {fetchFile, loadInBatches, NullLoader, isBrowser} from '@loaders.gl/core';
import {CRC32Hash, CRC32CHash, MD5Hash, SHA256Hash, NodeHash} from '@loaders.gl/crypto';
import {getBinaryData} from './test-utils/test-utils';

import CryptoJS from 'crypto-js';

const modules = {CryptoJS};

const {binaryData, repeatedData} = getBinaryData();

const TEST_CASES = [
  {
    title: 'streaming CSV',
    url: '@loaders.gl/csv/test/data/sample-very-long.csv',
    digests: {
      crc32: 'W5bZ9Q==',
      crc32c: 'YPBZXg==',
      /** Independently computed hash: `openssl md5 -binary sample-very-long.json | openssl base64` */
      md5: 'zmLuuVSkigYR9r5FcsKkCw=='
    }
  },
  {
    title: 'binary data',
    data: binaryData,
    digests: {
      sha256: 'gsoMi29gqdIBCEdTdRJW8VPFx5PQyFPTF4Lv7TJ4eQw='
    }
  },
  {
    title: 'binary data (repeated)',
    data: repeatedData,
    digests: {
      sha256: 'SnGMX2AgkPh21d2sxow8phQa8lh8rjf2Vc7GFCIwj2g='
      // 'bSCTuOJei5XsmAnqtmm2Aw/2EvUHldNdAxYb3mjSK9s=',
    }
  }
];

const HASHES = [new CRC32Hash(), new CRC32CHash(), new MD5Hash(), new SHA256Hash({modules})];

test('crypto#atomic hashes', async (t) => {
  await loadTestCaseData();

  for (const tc of TEST_CASES) {
    // test each test case against all precomputed digests/hashes
    for (const algorithm in tc.digests) {
      const cryptoHash = getHash(algorithm);

      const hash = await cryptoHash.hash(tc.data, 'base64');
      const expectedHash = tc.digests[algorithm];
      t.equal(hash, expectedHash, `${algorithm} hash is correct for ${tc.title}`);
    }
  }

  t.end();
});

test('crypto#streaming hashes', async (t) => {
  for (const tc of TEST_CASES) {
    // test each test case against all precomputed digests/hashes
    for (const algorithm in tc.digests) {
      if (tc.url) {
        const cryptoHash1 = getHash(algorithm);
        const Hash = cryptoHash1.constructor;

        let hash;
        // @ts-expect-error
        const cryptoHash = new Hash({
          crypto: {
            onEnd: (result) => {
              hash = result.hash;
            }
          }
        });

        const nullIterator = await loadInBatches(tc.url, NullLoader, {
          transforms: [cryptoHash.hashBatches]
        });

        // @ts-ignore
        // eslint-disable-next-line no-unused-vars, no-empty, max-depth
        for await (const batch of nullIterator) {
        }

        t.equal(hash, tc.digests[algorithm], `${algorithm} hash is correct for ${tc.title}`);
      }
    }
  }

  t.end();
});

// EXTRA TESTS NOT COVERED BY TEST CASES

test('NodeHash#hash', async (t) => {
  if (!isBrowser) {
    const cryptoHash = new NodeHash({crypto: {algorithm: 'SHA256'}});

    let hash = await cryptoHash.hash(binaryData, 'base64');
    t.equal(
      hash,
      'gsoMi29gqdIBCEdTdRJW8VPFx5PQyFPTF4Lv7TJ4eQw=',
      'binary data SHA256 hash is correct'
    );

    hash = await cryptoHash.hash(repeatedData, 'base64');
    t.equal(
      hash,
      'bSCTuOJei5XsmAnqtmm2Aw/2EvUHldNdAxYb3mjSK9s=',
      'repeated data SHA256 hash is correct'
    );
  }

  t.end();
});

// HELPERS

function getHash(algorithm) {
  const hash = HASHES.find((hash_) => hash_.name === algorithm);
  if (!hash) {
    throw new Error(algorithm);
  }
  return hash;
}

async function loadTestCaseData() {
  for (const tc of TEST_CASES) {
    if (tc.url) {
      const response = await fetchFile(tc.url);
      // @ts-expect-error
      tc.data = await response.arrayBuffer();
    }
  }
}
