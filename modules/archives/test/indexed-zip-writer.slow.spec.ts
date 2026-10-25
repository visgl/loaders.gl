// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {encodeIndexedZipInBatches} from '@loaders.gl/archives/zip/indexed-zip-writer';

/** Real entry-count sentinel qualification without encoding or retaining a complete archive. */
test('indexed ZIP selects ZIP64 at the 65535-record sentinel', async () => {
  const files = Object.fromEntries(
    Array.from({length: 65534}, (_, index) => [`file-${index}`, new ArrayBuffer(0)])
  );
  const options = {indexPath: '@index@', maxArchiveBytes: 16 * 1024 * 1024};
  const iterator = encodeIndexedZipInBatches(files, options)[Symbol.asyncIterator]();
  try {
    expect(new DataView((await iterator.next()).value!.buffer).getUint16(4, true)).toBe(45);
  } finally {
    await iterator.return?.();
  }
  await expect(
    encodeIndexedZipInBatches(files, {...options, zip64: 'never'})
      [Symbol.asyncIterator]()
      .next()
  ).rejects.toThrow('requires ZIP64');
});
