// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {encodeArrayBufferToBase64} from '@loaders.gl/loader-utils';

test.each([
  {bytes: [], encoded: ''},
  {bytes: [0], encoded: 'AA=='},
  {bytes: [0, 1], encoded: 'AAE='},
  {bytes: [0, 255, 128], encoded: 'AP+A'},
  {bytes: [0, 1, 2, 3], encoded: 'AAECAw=='}
])('binary base64 encoding preserves bytes and padding: $encoded', ({bytes, encoded}) => {
  expect(encodeArrayBufferToBase64(new Uint8Array(bytes).buffer)).toBe(encoded);
});

test.each([
  12287, 12288, 12289, 24578
])('binary base64 encoding round-trips %s bytes across chunk boundaries', byteLength => {
  const bytes = Uint8Array.from({length: byteLength}, (_, index) => index % 256);
  const encoded = encodeArrayBufferToBase64(bytes.buffer);
  const decoded = Uint8Array.from(atob(encoded), character => character.charCodeAt(0));
  expect(decoded).toEqual(bytes);
  expect(encoded.length).toBe(4 * Math.ceil(byteLength / 3));
});
