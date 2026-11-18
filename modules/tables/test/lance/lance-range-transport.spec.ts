// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {readLanceRemoteCoordinatesToArrow} from '../../src/lance/lance-arrow';

test.each([200, 204])('Lance rejects non-range successful status %s', async status => {
  await expect(
    readLanceRemoteCoordinatesToArrow(
      'https://example.invalid/a.lance',
      100,
      [],
      undefined,
      0,
      async () => new Response(status === 204 ? null : new Uint8Array(40), {status})
    )
  ).rejects.toThrow(/206/);
});
test('Lance rejects a visible mismatched footer range', async () => {
  await expect(
    readLanceRemoteCoordinatesToArrow(
      'https://example.invalid/a.lance',
      100,
      [],
      undefined,
      0,
      async () =>
        new Response(new Uint8Array(40), {
          status: 206,
          headers: {'Content-Range': 'bytes 0-39/100'}
        })
    )
  ).rejects.toThrow(/Content-Range/);
});
