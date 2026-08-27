import {expect, test} from 'vitest';
import {DATA_ARRAY} from '@loaders.gl/i3s/test/data/test.zip';
import {concatenateArrayBuffers} from '@loaders.gl/loader-utils';
import {DataViewReadableFile} from '../../src/parse-zip/readable-file-utils';
import {generateLocalHeader, parseZipLocalFileHeader} from '../../src/parse-zip/local-file-header';
test('SLPKLoader#local file header parse', async () => {
  const localFileHeader = await parseZipLocalFileHeader(
    0n,
    new DataViewReadableFile(new DataView(DATA_ARRAY.buffer))
  );
  expect(localFileHeader?.compressedSize).toEqual(39n);
  expect(localFileHeader?.fileNameLength).toEqual(9);
});
test('SLPKLoader#central directory file header generation', async () => {
  const header = generateLocalHeader({
    crc32: 0,
    fileName: '@specialIndexFileHASH128@1',
    length: 0
  });
  expect(header.byteLength).toBe(56);
});
test('SLPKLoader#local file header rejects missing zip64 extra field', async () => {
  const header = generateLocalHeader({crc32: 0, fileName: 'test.json', length: 0});
  const view = new DataView(header);
  view.setUint32(18, 0xffffffff, true);
  view.setUint32(22, 0xffffffff, true);
  await await expect(parseZipLocalFileHeader(0n, new DataViewReadableFile(view))).rejects.toThrow(
    /Invalid ZIP archive:.*ZIP64/
  );
});
test('SLPKLoader#local file header rejects truncated zip64 extra field', async () => {
  const header = generateLocalHeader({crc32: 0, fileName: 'test.json', length: 0});
  const view = new DataView(header);
  view.setUint32(18, 0xffffffff, true);
  view.setUint32(22, 0xffffffff, true);
  view.setUint16(28, 8, true);
  const extra = new Uint8Array([0x01, 0x00, 0x10, 0x00, 0, 0, 0, 0]);
  const buffer = new Uint8Array(header.byteLength + extra.byteLength);
  buffer.set(new Uint8Array(header), 0);
  buffer.set(extra, header.byteLength);
  await await expect(
    parseZipLocalFileHeader(0n, new DataViewReadableFile(new DataView(buffer.buffer)))
  ).rejects.toThrow(/Invalid ZIP archive:.*ZIP64/);
});
test('SLPKLoader#local file header parses valid zip64 sizes', async () => {
  const header = generateLocalHeader({
    crc32: 0,
    fileName: 'test.json',
    length: 0xffffffffff
  });
  const localFileHeader = await parseZipLocalFileHeader(
    0n,
    new DataViewReadableFile(new DataView(header))
  );
  expect(localFileHeader?.compressedSize).toBe(0xffffffffffn);
  expect(localFileHeader?.extraFieldLength).toBe(20);
  expect(localFileHeader?.fileDataOffset).toBe(BigInt(header.byteLength));
});
test('SLPKLoader#local file header requires the ZIP64 size pair', async () => {
  const compressedHeader = generateLocalHeader({crc32: 0, fileName: 'test.json', length: 0});
  const compressedHeaderView = new DataView(compressedHeader);
  compressedHeaderView.setUint32(18, 0xffffffff, true);
  compressedHeaderView.setUint16(28, 20, true);
  const compressedExtraField = new DataView(new ArrayBuffer(20));
  compressedExtraField.setUint16(0, 0x0001, true);
  compressedExtraField.setUint16(2, 16, true);
  compressedExtraField.setBigUint64(4, 0x010203040506n, true);
  compressedExtraField.setBigUint64(12, 0x112233445566n, true);
  const compressedFileHeader = await parseZipLocalFileHeader(
    0n,
    new DataViewReadableFile(
      new DataView(concatenateArrayBuffers(compressedHeader, compressedExtraField.buffer))
    )
  );
  expect(compressedFileHeader?.compressedSize).toBe(0x112233445566n);
  const uncompressedHeader = generateLocalHeader({crc32: 0, fileName: 'test.json', length: 0});
  const uncompressedHeaderView = new DataView(uncompressedHeader);
  uncompressedHeaderView.setUint32(22, 0xffffffff, true);
  uncompressedHeaderView.setUint16(28, 20, true);
  const uncompressedExtraField = new DataView(new ArrayBuffer(20));
  uncompressedExtraField.setUint16(0, 0x0001, true);
  uncompressedExtraField.setUint16(2, 16, true);
  uncompressedExtraField.setBigUint64(4, 0x223344556677n, true);
  uncompressedExtraField.setBigUint64(12, 0x334455667788n, true);
  const uncompressedFileHeader = await parseZipLocalFileHeader(
    0n,
    new DataViewReadableFile(
      new DataView(concatenateArrayBuffers(uncompressedHeader, uncompressedExtraField.buffer))
    )
  );
  expect(uncompressedFileHeader?.compressedSize).toBe(0n);
});
test('SLPKLoader#local file header finds zip64 data after an unrelated record', async () => {
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
  expect(localFileHeader?.compressedSize).toBe(0xffffffffffn);
  expect(localFileHeader?.extraFieldLength).toBe(28);
  expect(localFileHeader?.fileDataOffset).toBe(BigInt(combinedHeader.byteLength));
});
