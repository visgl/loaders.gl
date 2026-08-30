// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {getFirstCharacters, getMagicString} from '@loaders.gl/loader-utils';

describe('getFirstCharacters', () => {
  test('reads strings, ArrayBuffers, and offset typed-array views', () => {
    expect(getFirstCharacters('loaders.gl', 7)).toBe('loaders');
    expect(getFirstCharacters(new TextEncoder().encode('MAGIC!').buffer, 5)).toBe('MAGIC');

    const padded = new TextEncoder().encode('--TILE++');
    expect(getFirstCharacters(padded.subarray(2, 6), 4)).toBe('TILE');
  });

  test('uses the default length and rejects unsupported or short input', () => {
    expect(getFirstCharacters('123456')).toBe('12345');
    expect(getFirstCharacters({} as ArrayBuffer, 2)).toBe('');
    expect(getMagicString(new Uint8Array([65, 66]).buffer, 0, 3)).toBe('');
    expect(getMagicString(new Uint8Array([65, 66, 67]).buffer, 1, 2)).toBe('');
  });

  test('reads magic bytes from a nonzero offset', () => {
    const bytes = new TextEncoder().encode('xxglTFyy');
    expect(getMagicString(bytes.buffer, 2, 4)).toBe('glTF');
  });
});
