// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {readArrayBuffer, readBlob} from '../../../src/lib/fetch/read-array-buffer';

test('readArrayBuffer slices blobs, buffers, and strings', async () => {
  const bytes = new Uint8Array([0, 1, 2, 3, 4]);
  await expect(readArrayBuffer(new Blob([bytes]), 1, 3)).resolves.toEqual(
    new Uint8Array([1, 2, 3]).buffer
  );
  await expect(readArrayBuffer(bytes.buffer, 2, 2)).resolves.toEqual(new Uint8Array([2, 3]).buffer);
  expect(new TextDecoder().decode(await readArrayBuffer('abcdef', 2, 3))).toBe('cde');
  await expect(readBlob(new Blob([]))).resolves.toEqual(new ArrayBuffer(0));
});
