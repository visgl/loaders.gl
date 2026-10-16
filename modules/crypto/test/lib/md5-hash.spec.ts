// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {MD5Hash} from '@loaders.gl/crypto';

const textEncoder = new TextEncoder();

test.each([
  ['', 'd41d8cd98f00b204e9800998ecf8427e'],
  ['a', '0cc175b9c0f1b6a831c399e269772661'],
  ['abc', '900150983cd24fb0d6963f7d28e17f72'],
  ['message digest', 'f96b697d7cb7938d525a2f31aaf161d0'],
  ['abcdefghijklmnopqrstuvwxyz', 'c3fcd3d76192e4007dfb496cca67e13b'],
  [
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    'd174ab98d277d9f5a5611c2c9f419d9f'
  ],
  [
    '12345678901234567890123456789012345678901234567890123456789012345678901234567890',
    '57edf4a22be3c955ac49da2e2107b67a'
  ]
])('MD5Hash.hashSync matches the RFC 1321 vector %j', (input, expected) => {
  expect(new MD5Hash().hashSync(textEncoder.encode(input).buffer, 'hex')).toBe(expected);
});

test('MD5Hash.hashSync supports binary input and base64 encoding without initializing WASM', () => {
  const instantiate = vi.spyOn(WebAssembly, 'instantiate').mockImplementation(() => {
    throw new Error('Synchronous hashing must use JavaScript');
  });
  try {
    const hash = new MD5Hash();
    const input = new Uint8Array([0, 128, 255]).buffer;
    expect(hash.hashSync(input, 'hex')).toBe('edaa0390b22ab88b20932fa7a5e019ff');
    expect(hash.hashSync(input, 'base64')).toBe('7aoDkLIquIsgky+npeAZ/w==');
    expect(instantiate).not.toHaveBeenCalled();
  } finally {
    instantiate.mockRestore();
  }
});

test.each([
  [55, 'ef1772b6dff9a122358552954ad0df65'],
  [56, '3b0c8ac703f828b04c6c197006d17218'],
  [63, 'b06521f39153d618550606be297466d5'],
  [64, '014842d480b571495a4a0363793f7367'],
  [65, 'c743a45e0d2e6a95cb859adae0248435']
])('MD5Hash.hashSync handles padding at %i bytes', (length, expected) => {
  expect(new MD5Hash().hashSync(textEncoder.encode('a'.repeat(length)).buffer, 'hex')).toBe(
    expected
  );
});
