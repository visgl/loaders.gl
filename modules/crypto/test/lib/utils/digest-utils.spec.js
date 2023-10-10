import test from 'tape-promise/tape';
import {encodeNumber, encodeHex, encodeBase64} from '@loaders.gl/crypto';
import TEST_CASES from '../crc32c-test-cases.json' assert {type: 'json'};

test('encodeHexToBase64#crc32 test cases', (t) => {
  for (const type in TEST_CASES) {
    const set = TEST_CASES[type];

    for (const tc of set.cases) {
      if (!tc.charset) {
        tc.expected = encodeNumber(tc.want, 'base64');
        t.ok(tc.expected, `${tc.want} encodeed to ${tc.expected}`);
      }
    }

    set.expected = encodeHex(set.want.toString(16), 'base64');
  }
  t.end();
});

test('encodeHexToBase64', (t) => {
  t.equal(encodeHex('f85d741', 'base64'), 'D4XXQQ==', 'encode zero leading hex correctly');
  t.end();
});

test('encodeBase64ToHex', (t) => {
  t.equal(encodeBase64('D4XXQQ==', 'hex'), '0f85d741');
  t.end();
});
