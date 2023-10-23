import test from 'tape-promise/tape';
import {fetchFile} from '@loaders.gl/core';
import {CRC32CHash, encodeNumber} from '@loaders.gl/crypto';
import TEST_CASES from './crc32c-test-cases.json' assert {type: 'json'};

test('crc32c#additional tests', async (t) => {
  for (const type in TEST_CASES) {
    const set = TEST_CASES[type];

    // Prepare the test cases

    for (const tc of set.cases) {
      const mediaType = tc.charset ? `charset=${tc.charset}` : 'base64';
      const response = await fetchFile(`data:${mediaType},${tc.input}`);
      tc.arrayBuffer = await response.arrayBuffer();
      tc.expected = encodeNumber(tc.want, 'base64');
    }
    set.expected = encodeNumber(set, 'base64');

    // Run the test cases
    for (const tc of set.cases) {
      if (tc.expected && !tc.charset) {
        const hash = await new CRC32CHash().hash(tc.arrayBuffer, 'base64');
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
    const iterator = makeTransformIterator(arrayBuffers, CRC32CHash, {
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
