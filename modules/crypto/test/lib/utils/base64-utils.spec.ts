// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';

import {asciiToBase64, base64ToAscii} from '../../../src/lib/utils/base64-utils';

describe('base64 utilities', () => {
  test.each([
    ['', ''],
    ['f', 'Zg=='],
    ['fo', 'Zm8='],
    ['foo', 'Zm9v'],
    ['foobar', 'Zm9vYmFy']
  ])('encodes %j', (value, encoded) => {
    expect(asciiToBase64(value)).toBe(encoded);
    expect(base64ToAscii(encoded)).toBe(value);
  });

  test('handles whitespace and invalid base64 input', () => {
    expect(base64ToAscii(' Z m9v\n')).toBe('foo');
    expect(base64ToAscii('A')).toBe('');
    expect(base64ToAscii('Zm$9v')).toBe('');
    expect(asciiToBase64('€')).toBeNull();
  });

  test('supports string coercion and all encoder alphabet ranges', () => {
    expect(asciiToBase64(123 as any)).toBe('MTIz');
    expect(asciiToBase64('\xfb\xff')).toBe('+/8=');
    expect(base64ToAscii(['Zg=='] as any)).toBe('f');
    expect(base64ToAscii('+/8=')).toBe('\xfb\xff');
  });
});
