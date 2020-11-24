import test from 'tape-promise/tape';
import {fetchFile, loadInBatches, NullLoader} from '@loaders.gl/core';
import {CRC32CHashTransform, _hexToBase64, _toHex} from '@loaders.gl/crypto';
import TEST_CASES from './crc32c-test-cases.json';

const CSV_URL = '@loaders.gl/csv/test/data/sample-very-long.csv';
const CSV_CRC32 = 'YPBZXg==';

test('CRC32CHashTransform#hashSync(CRC32, CSV, against external hash)', async t => {
  const response = await fetchFile(CSV_URL);
  const data = await response.arrayBuffer();

  const hash = CRC32CHashTransform.hashSync(data);
  t.equal(hash, CSV_CRC32, 'sync hash is correct');

  t.end();
});

test('CRC32CHashTransform#iterator(CSV stream, against external hash)', async t => {
  let hash;

  const nullIterator = await loadInBatches(CSV_URL, NullLoader, {
    transforms: [CRC32CHashTransform],
    crypto: {
      onEnd: result => {
        hash = result.hash;
      }
    }
  });

  // eslint-disable-next-line no-unused-vars, no-empty
  for await (const batch of nullIterator) {
  }

  t.equal(hash, CSV_CRC32, 'streaming hash is correct');

  t.end();
});

test('crc32c', async t => {
  for (const type in TEST_CASES) {
    const set = TEST_CASES[type];

    // Prepare the test cases

    for (const tc of set.cases) {
      const mediaType = tc.charset ? `charset=${tc.charset}` : 'base64';
      const response = await fetchFile(`data:${mediaType},${tc.input}`);
      tc.arrayBuffer = await response.arrayBuffer();
      tc.expected = _hexToBase64(_toHex(tc.want));
    }
    set.expected = _hexToBase64(_toHex(set));

    // Run the test cases
    for (const tc of set.cases) {
      if (tc.expected && !tc.charset) {
        const hash = CRC32CHashTransform.hashSync(tc.arrayBuffer);
        t.equals(
          hash,
          tc.expected,
          `should digest "${tc.input.slice(0, 10)}..." correctly ${tc.expected} ${tc.want}`
        );
      }
    }

    // Run a streaming digest on all test cases.
    /*
    const arrayBuffers = set.cases.map(tc => tc.arrayBuffer);

    let hash;

    // @ts-ignore
    const iterator = makeTransformIterator(arrayBuffers, CRC32CHashTransform, {
      onEnd: result => {
        hash = result.hash;
      }
    });
  
    const nullIterator = await parseInBatches(iterator, NullLoader);

    t.equals(hash, set.expected, `should digest all test chunks correctly`);
    */
  }
  t.end();
});
