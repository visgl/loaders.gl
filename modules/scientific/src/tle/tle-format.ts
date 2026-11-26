// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/core/loader-utils';

/**
 * Returns `true` when the first bytes contain a TLE line 1 that a TLE line 2 follows.
 *
 * @param arrayBuffer - First bytes of the data.
 */
function testTLE(arrayBuffer: ArrayBuffer): boolean {
  const text = new TextDecoder().decode(
    new Uint8Array(arrayBuffer, 0, Math.min(arrayBuffer.byteLength, 1024))
  );
  return /(^|\n)1 [0-9A-Z ]{5}[A-Z ] [^\r\n]{50,}\r?\n2 [0-9A-Z ]{5} /.test(text);
}

/** NORAD two-line element set (TLE) text, with or without name lines. */
export const TLEFormat = {
  name: 'TLE (Two-Line Element Set)',
  id: 'tle',
  module: 'scientific',
  category: 'table',
  encoding: 'text',
  format: 'tle',
  extensions: ['tle', '3le'],
  mimeTypes: [],
  text: true,
  tests: [testTLE]
} as const satisfies Format;
