import {expect, test} from 'vitest';
import {isBrowser} from '@loaders.gl/core';
if (!isBrowser) {
  test('TextEncoder', () => {
    expect(
      new TextEncoder(),
      'TextEncoder successfully instantiated (available or polyfilled)'
    ).toBeTruthy();
  });
  test('TextDecoder', async () => {
    expect(
      new TextDecoder(),
      'TextDecoder successfully instantiated (available or polyfilled)'
    ).toBeTruthy();
    const buffer = Buffer.from('México', 'latin1');
    const arrayBuffer = buffer;
    expect(arrayBuffer, 'node Buffer parses latin1 ').toBeTruthy();
    const textDecoder = new TextDecoder('latin1');
    expect(
      textDecoder,
      'TextDecoder successfully instantiated (available or polyfilled)'
    ).toBeTruthy();
    expect(textDecoder.decode(arrayBuffer)).toBe('México');
  });
}
