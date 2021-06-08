import test from 'tape-promise/tape';
import {_toHex, _hexToBase64} from '@loaders.gl/crypto';
import TEST_CASES from './crc32c-test-cases.json';

test('hexToBase64', (t) => {
  for (const type in TEST_CASES) {
    const set = TEST_CASES[type];

    for (const tc of set.cases) {
      if (!tc.charset) {
        tc.expected = _hexToBase64(_toHex(tc.want));
        t.ok(tc.expected, `${tc.want} converted to ${tc.expected}`);
      }
    }

    set.expected = _hexToBase64(set.want.toString(16));
  }
  t.end();
});

test('hexToBase64#convert zero leading hex correctly', (t) => {
  t.equal(_hexToBase64('f85d741'), 'D4XXQQ==');
  t.end();
});
