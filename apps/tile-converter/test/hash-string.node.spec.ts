// SPDX-License-Identifier: MIT
import {expect, test} from 'vitest';
import {hashString} from '../src/v4/lib/utils/hash-string';

test.each([
  ['', 'd41d8cd98f00b204e9800998ecf8427e'],
  ['123', '202cb962ac59075b964b07152d234b70'],
  ['Élévation 東京', '8cb0543d02642291156e27c5abb05e6f'],
  ['😀', '2a02eac39d716a70ecf37579185927b6'],
  ['hello', '5d41402abc4b2a76b9719d911017c592']
])('converter identifiers preserve the legacy digest of %j', (input, expected) => {
  expect(hashString(input)).toBe(expected);
});

test.each([
  '\uD800',
  '\uDC00'
])('converter identifiers reject unpaired UTF-16 surrogates', input => {
  expect(() => hashString(input)).toThrow(URIError);
});
