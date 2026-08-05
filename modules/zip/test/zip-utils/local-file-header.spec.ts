// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {DATA_ARRAY} from '@loaders.gl/i3s/test/data/test.zip';
import {concatenateArrayBuffers} from '@loaders.gl/loader-utils';

import {DataViewReadableFile} from '../../src/parse-zip/readable-file-utils';
import {generateLocalHeader, parseZipLocalFileHeader} from '../../src/parse-zip/local-file-header';

test('SLPKLoader#local file header parse', async t => {
  const localFileHeader = await parseZipLocalFileHeader(
    0n,
    new DataViewReadableFile(new DataView(DATA_ARRAY.buffer))
  );
  t.deepEqual(localFileHeader?.compressedSize, 39n);
  t.deepEqual(localFileHeader?.fileNameLength, 9);
  t.end();
});

test('SLPKLoader#central directory file header generation', async t => {
  const header = generateLocalHeader({
    crc32: 0,
    fileName: '@specialIndexFileHASH128@1',
    length: 0
  });
  t.equal(header.byteLength, 56);
  t.end();
});

test('SLPKLoader#local file header rejects missing zip64 extra field', async t => {
  const header = generateLocalHeader({crc32: 0, fileName: 'test.json', length: 0});
  const view = new DataView(header);
  view.setUint32(18, 0xffffffff, true);
  view.setUint32(22, 0xffffffff, true);

  await t.rejects(
    parseZipLocalFileHeader(0n, new DataViewReadableFile(view)),
    /Invalid ZIP archive:.*ZIP64/
  );
  t.end();
});

test('SLPKLoader#local file header rejects truncated zip64 extra field', async t => {
  const header = generateLocalHeader({crc32: 0, fileName: 'test.json', length: 0});
  const view = new DataView(header);
  view.setUint32(18, 0xffffffff, true);
  view.setUint32(22, 0xffffffff, true);
  view.setUint16(28, 8, true);
  const extra = new Uint8Array([0x01, 0x00, 0x10, 0x00, 0, 0, 0, 0]);
  const buffer = new Uint8Array(header.byteLength + extra.byteLength);
  buffer.set(new Uint8Array(header), 0);
  buffer.set(extra, header.byteLength);

  await t.rejects(
    parseZipLocalFileHeader(0n, new DataViewReadableFile(new DataView(buffer.buffer))),
    /Invalid ZIP archive:.*ZIP64/
  );
  t.end();
});

test('SLPKLoader#local file header parses valid zip64 sizes', async t => {
  const header = generateLocalHeader({
    crc32: 0,
    fileName: 'test.json',
    length: 0xffffffffff
  });
  const localFileHeader = await parseZipLocalFileHeader(
    0n,
    new DataViewReadableFile(new DataView(header))
  );

  t.equal(localFileHeader?.compressedSize, 0xffffffffffn);
  t.equal(localFileHeader?.extraFieldLength, 20);
  t.equal(localFileHeader?.fileDataOffset, BigInt(header.byteLength));
  t.end();
});

test('SLPKLoader#local file header parses only sentinel-backed zip64 fields', async t => {
  const compressedHeader = generateLocalHeader({crc32: 0, fileName: 'test.json', length: 0});
  const compressedHeaderView = new DataView(compressedHeader);
  compressedHeaderView.setUint32(18, 0xffffffff, true);
  compressedHeaderView.setUint16(28, 12, true);
  const compressedExtraField = new DataView(new ArrayBuffer(12));
  compressedExtraField.setUint16(0, 0x0001, true);
  compressedExtraField.setUint16(2, 8, true);
  compressedExtraField.setBigUint64(4, 0x112233445566n, true);

  const compressedFileHeader = await parseZipLocalFileHeader(
    0n,
    new DataViewReadableFile(
      new DataView(concatenateArrayBuffers(compressedHeader, compressedExtraField.buffer))
    )
  );
  t.equal(compressedFileHeader?.compressedSize, 0x112233445566n);

  const uncompressedHeader = generateLocalHeader({crc32: 0, fileName: 'test.json', length: 0});
  const uncompressedHeaderView = new DataView(uncompressedHeader);
  uncompressedHeaderView.setUint32(22, 0xffffffff, true);
  uncompressedHeaderView.setUint16(28, 12, true);
  const uncompressedExtraField = new DataView(new ArrayBuffer(12));
  uncompressedExtraField.setUint16(0, 0x0001, true);
  uncompressedExtraField.setUint16(2, 8, true);
  uncompressedExtraField.setBigUint64(4, 0x223344556677n, true);

  const uncompressedFileHeader = await parseZipLocalFileHeader(
    0n,
    new DataViewReadableFile(
      new DataView(concatenateArrayBuffers(uncompressedHeader, uncompressedExtraField.buffer))
    )
  );
  t.equal(uncompressedFileHeader?.compressedSize, 0n);
  t.end();
});

test('SLPKLoader#local file header finds zip64 data after an unrelated record', async t => {
  const header = generateLocalHeader({
    crc32: 0,
    fileName: 'test.json',
    length: 0xffffffffff
  });
  const headerView = new DataView(header);
  const fileNameEndOffset = 30 + headerView.getUint16(26, true);
  const headerAndFileName = header.slice(0, fileNameEndOffset);
  new DataView(headerAndFileName).setUint16(28, 28, true);
  const unrelatedRecord = new Uint8Array([0x99, 0x99, 0x04, 0x00, 0x01, 0x00, 0x10, 0x00]);
  const zip64ExtraField = header.slice(fileNameEndOffset);
  const combinedHeader = concatenateArrayBuffers(
    headerAndFileName,
    unrelatedRecord.buffer,
    zip64ExtraField
  );

  const localFileHeader = await parseZipLocalFileHeader(
    0n,
    new DataViewReadableFile(new DataView(combinedHeader))
  );

  t.equal(localFileHeader?.compressedSize, 0xffffffffffn);
  t.equal(localFileHeader?.extraFieldLength, 28);
  t.equal(localFileHeader?.fileDataOffset, BigInt(combinedHeader.byteLength));
  t.end();
});
