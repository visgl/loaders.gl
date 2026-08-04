// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {DATA_ARRAY} from '@loaders.gl/i3s/test/data/test.zip';

import {DataViewReadableFile} from '../../src/parse-zip/readable-file-utils';
import {generateCDHeader, parseZipCDFileHeader} from '../../src/parse-zip/cd-file-header';
import {createZip64Info} from '../../src/parse-zip/zip64-info-generation';

test('SLPKLoader#central directory file header parse', async t => {
  const cdFileHeader = await parseZipCDFileHeader(
    78n,
    new DataViewReadableFile(new DataView(DATA_ARRAY.buffer))
  );
  t.deepEqual(cdFileHeader?.compressedSize, 39n);
  t.deepEqual(cdFileHeader?.fileNameLength, 9);
  t.deepEqual(cdFileHeader?.fileName, 'test.json');
  t.deepEqual(cdFileHeader?.localHeaderOffset, 0n);
  t.end();
});

test('SLPKLoader#central directory file header generation', async t => {
  const header = generateCDHeader({
    crc32: 0,
    fileName: '@specialIndexFileHASH128@1',
    offset: BigInt(0xffffffffff),
    length: 0
  });
  t.equal(header.byteLength, 84);
  t.end();
});

test('SLPKLoader#zip64 info generation', async t => {
  const header = createZip64Info({
    size: 0xffffffffff
  });
  t.equal(header.byteLength, 20);
  t.end();
});

test('SLPKLoader#central directory file header rejects missing zip64 extra field', async t => {
  const header = generateCDHeader({crc32: 0, fileName: 'test.json', length: 0, offset: 0n});
  const view = new DataView(header);
  view.setUint32(20, 0xffffffff, true);
  view.setUint32(24, 0xffffffff, true);
  await t.rejects(
    parseZipCDFileHeader(0n, new DataViewReadableFile(view)),
    /Invalid ZIP archive:.*ZIP64/
  );
  t.end();
});

test('SLPKLoader#central directory file header rejects truncated zip64 extra field', async t => {
  const header = generateCDHeader({crc32: 0, fileName: 'test.json', length: 0, offset: 0n});
  const view = new DataView(header);
  view.setUint32(20, 0xffffffff, true);
  view.setUint32(24, 0xffffffff, true);
  view.setUint16(30, 8, true);
  const extra = new Uint8Array([0x01, 0x00, 0x10, 0x00, 0, 0, 0, 0]);
  const buffer = new Uint8Array(header.byteLength + extra.byteLength);
  buffer.set(new Uint8Array(header), 0);
  buffer.set(extra, header.byteLength);
  await t.rejects(
    parseZipCDFileHeader(0n, new DataViewReadableFile(new DataView(buffer.buffer))),
    /Invalid ZIP archive:.*ZIP64/
  );
  t.end();
});

test('SLPKLoader#central directory file header parse with valid zip64 extra field', async t => {
  const header = generateCDHeader({
    crc32: 0,
    fileName: 'test.json',
    length: 0xffffffffff,
    offset: 0n
  });
  const cdFileHeader = await parseZipCDFileHeader(
    0n,
    new DataViewReadableFile(new DataView(header))
  );
  t.equal(cdFileHeader?.uncompressedSize, BigInt(0xffffffffff));
  t.equal(cdFileHeader?.compressedSize, BigInt(0xffffffffff));
  t.equal(cdFileHeader?.extraFieldLength, 20);
  t.equal(cdFileHeader?.localHeaderOffset, 0n);
  t.end();
});

test('SLPKLoader#central directory file header parses all zip64 field widths', async t => {
  const header = generateCDHeader({crc32: 0, fileName: 'test.json', length: 0, offset: 0n});
  const view = new DataView(header);
  view.setUint32(20, 0xffffffff, true);
  view.setUint32(24, 0xffffffff, true);
  view.setUint16(30, 32, true);
  view.setUint16(34, 0xffff, true);
  view.setUint32(42, 0xffffffff, true);

  const extra = new DataView(new ArrayBuffer(32));
  extra.setUint16(0, 0x0001, true);
  extra.setUint16(2, 28, true);
  extra.setBigUint64(4, 0x112233445566n, true);
  extra.setBigUint64(12, 0x223344556677n, true);
  extra.setBigUint64(20, 0x334455667788n, true);
  extra.setUint32(28, 0x12345678, true);

  const buffer = new Uint8Array(header.byteLength + extra.byteLength);
  buffer.set(new Uint8Array(header), 0);
  buffer.set(new Uint8Array(extra.buffer), header.byteLength);
  const cdFileHeader = await parseZipCDFileHeader(
    0n,
    new DataViewReadableFile(new DataView(buffer.buffer))
  );

  t.equal(cdFileHeader?.uncompressedSize, 0x112233445566n);
  t.equal(cdFileHeader?.compressedSize, 0x223344556677n);
  t.equal(cdFileHeader?.localHeaderOffset, 0x334455667788n);
  t.equal(cdFileHeader?.startDisk, 0x12345678n);
  t.end();
});

test('SLPKLoader#central directory file header parse with zip64 extra field after unrelated record', async t => {
  const header = generateCDHeader({crc32: 0, fileName: 'test.json', length: 0, offset: 0n});
  const view = new DataView(header);
  view.setUint32(20, 0xffffffff, true);
  view.setUint32(24, 0xffffffff, true);
  view.setUint16(30, 28, true);
  const extra = new DataView(new ArrayBuffer(28));
  extra.setUint16(0, 0x9999, true);
  extra.setUint16(2, 4, true);
  extra.setUint16(4, 0x0001, true);
  extra.setUint16(6, 16, true);
  extra.setUint16(8, 0x0001, true);
  extra.setUint16(10, 16, true);
  extra.setBigUint64(12, BigInt(0x1122334455), true);
  extra.setBigUint64(20, BigInt(0x66778899aa), true);
  const buffer = new Uint8Array(header.byteLength + extra.byteLength);
  buffer.set(new Uint8Array(header), 0);
  buffer.set(new Uint8Array(extra.buffer), header.byteLength);
  const cdFileHeader = await parseZipCDFileHeader(
    0n,
    new DataViewReadableFile(new DataView(buffer.buffer))
  );
  t.equal(cdFileHeader?.uncompressedSize, BigInt(0x1122334455));
  t.equal(cdFileHeader?.compressedSize, BigInt(0x66778899aa));
  t.equal(cdFileHeader?.extraFieldLength, 28);
  t.end();
});
