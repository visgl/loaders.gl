import {expect, test} from 'vitest';
import {decodeHex, encodeHex} from '@loaders.gl/loader-utils';

test('hex transcoder round-trips bytes and handles empty input', () => {
  const bytes = new Uint8Array([0, 1, 15, 16, 127, 128, 255]);

  expect(encodeHex(bytes)).toBe('00010f107f80ff');
  expect(Array.from(decodeHex('00010f107f80ff'))).toEqual(Array.from(bytes));
  expect(encodeHex(new Uint8Array())).toBe('');
  expect(Array.from(decodeHex(''))).toEqual([]);
});
