// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {encodeNumber, encodeHex, encodeBase64} from '@loaders.gl/crypto';

const loadJSON = async (relativePath: string) => {
  const url = new URL(relativePath, import.meta.url);
  if (url.protocol === 'file:' && typeof window === 'undefined') {
    const {readFile} = await import('fs/promises');
    return JSON.parse(await readFile(url, 'utf8'));
  }
  const response = await fetch(url);
  return response.json();
};

const TEST_CASES = await loadJSON('../crc32c-test-cases.json');

test('encodeHexToBase64#crc32 test cases', () => {
  for (const type in TEST_CASES) {
    const set = TEST_CASES[type];

    for (const tc of set.cases) {
      if (!tc.charset) {
        tc.expected = encodeNumber(tc.want, 'base64');
        expect(tc.expected, `${tc.want} encodeed to ${tc.expected}`).toBeTruthy();
      }
    }

    set.expected = encodeHex(set.want.toString(16), 'base64');
  }
});

test('encodeHexToBase64', () => {
  expect(encodeHex('f85d741', 'base64'), 'encode zero leading hex correctly').toBe('D4XXQQ==');
});

test('encodeBase64ToHex', () => {
  expect(encodeBase64('D4XXQQ==', 'hex')).toBe('0f85d741');
});
