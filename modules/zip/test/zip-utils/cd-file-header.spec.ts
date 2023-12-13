// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {DATA_ARRAY} from '@loaders.gl/i3s/test/data/test.zip';

import {DataViewFile} from '@loaders.gl/loader-utils';
import {generateCDHeader, parseZipCDFileHeader} from '../../src/parse-zip/cd-file-header';
import {createZip64Info} from '../../src/parse-zip/zip64-info-generation';

test('SLPKLoader#central directory file header parse', async (t) => {
  const cdFileHeader = await parseZipCDFileHeader(
    78n,
    new DataViewFile(new DataView(DATA_ARRAY.buffer))
  );
  t.deepEqual(cdFileHeader?.compressedSize, 39n);
  t.deepEqual(cdFileHeader?.fileNameLength, 9);
  t.deepEqual(cdFileHeader?.fileName, 'test.json');
  t.deepEqual(cdFileHeader?.localHeaderOffset, 0n);
  t.end();
});

test('SLPKLoader#central directory file header generation', async (t) => {
  const header = generateCDHeader({
    crc32: 0,
    fileName: '@specialIndexFileHASH128@1',
    offset: BigInt(0xffffffffff),
    length: 0
  });
  t.equal(header.byteLength, 84);
  t.end();
});

test('SLPKLoader#zip64 info generation', async (t) => {
  const header = createZip64Info({
    size: 0xffffffffff
  });
  t.equal(header.byteLength, 20);
  t.end();
});
