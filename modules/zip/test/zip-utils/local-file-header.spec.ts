// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {DATA_ARRAY} from '@loaders.gl/i3s/test/data/test.zip';

import {DataViewFile} from '@loaders.gl/loader-utils';
import {generateLocalHeader, parseZipLocalFileHeader} from '../../src/parse-zip/local-file-header';

test('SLPKLoader#local file header parse', async (t) => {
  const localFileHeader = await parseZipLocalFileHeader(
    0n,
    new DataViewFile(new DataView(DATA_ARRAY.buffer))
  );
  t.deepEqual(localFileHeader?.compressedSize, 39n);
  t.deepEqual(localFileHeader?.fileNameLength, 9);
  t.end();
});

test('SLPKLoader#central directory file header generation', async (t) => {
  const header = generateLocalHeader({
    crc32: 0,
    fileName: '@specialIndexFileHASH128@1',
    length: 0
  });
  t.equal(header.byteLength, 56);
  t.end();
});
