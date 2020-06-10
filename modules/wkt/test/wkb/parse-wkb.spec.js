import test from 'tape-promise/tape';
import parseWKB from '@loaders.gl/wkt/lib/parse-wkb';
import {fetchFile} from '@loaders.gl/core';
import hexStringToArrayBuffer from './hex-string-to-array-buffer';

const WKB_2D_TEST_CASES = '@loaders.gl/wkt/test/data/wkb-testdata2d.json';

test('parseWKB2D', async t => {
  const response = await fetchFile(WKB_2D_TEST_CASES);
  const TEST_CASES = await response.json();

  // TODO parseWKB outputs TypedArrays; testCase contains regular arrays
  for (const testCase of Object.values(TEST_CASES)) {
    // Little endian
    const bufferLittleEndian = hexStringToArrayBuffer(testCase.wkb);
    t.deepEqual(parseWKB(bufferLittleEndian), testCase.binary);

    // Big endian
    const bufferBigEndian = hexStringToArrayBuffer(testCase.wkbXdr);
    t.deepEqual(parseWKB(bufferBigEndian), testCase.binary);
  }

  t.end();
});
