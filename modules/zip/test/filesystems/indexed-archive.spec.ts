// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {BlobFile} from '@loaders.gl/loader-utils';
import {
  IndexedArchive,
  ZipFileSystem,
  encodeZip,
  parseHashTable,
  composeHashFile
} from '@loaders.gl/zip';
import {encodeIndexedZip} from '@loaders.gl/zip/indexed-zip-writer';

/** Exposes only the common transport for owning-module conformance. */
class TestArchive extends IndexedArchive {
  /** Reads an indexed or named entry without format-level aliases. */
  async getFile(path: string): Promise<ArrayBuffer> {
    return await this.getFileWithoutHash(path);
  }
}

/** Tiny immutable resource map. */
const FILES = {'A.bin': new Uint8Array([1, 2, 3]).buffer};

test('indexed archive caches ZIP metadata, verifies CRC, and shares filesystem ownership', async () => {
  const bytes = await encodeIndexedZip(FILES, {
    indexPath: '@index@',
    maxArchiveBytes: 4096,
    zip64: 'always'
  });
  const file = new BlobFile(bytes);
  const read = vi.spyOn(file, 'read');
  const close = vi.spyOn(file, 'close');
  const archive = new TestArchive(file);
  expect(await archive.initializeIndex('@index@')).toBe(true);
  expect(await archive.getFile('A.bin')).toEqual(FILES['A.bin']);
  const metadataReads = read.mock.calls.filter(([, length]) => length !== 3).length;
  expect(await archive.getFile('A.bin')).toEqual(FILES['A.bin']);
  expect(read.mock.calls.filter(([, length]) => length !== 3)).toHaveLength(metadataReads);
  const filesystem = new ZipFileSystem(archive);
  expect(await filesystem.readdir()).toEqual(['A.bin', '@index@']);
  await filesystem.destroy();
  await archive.close();
  expect(close).toHaveBeenCalledOnce();
  await expect(archive.getFile('A.bin')).rejects.toThrow('closed');
});

test('indexed archive fallback retains format case policy and supports decoded DEFLATE', async () => {
  const bytes = await encodeZip(FILES, {compression: 'deflate'});
  const archive = new TestArchive(new BlobFile(bytes));
  try {
    expect(await archive.initializeIndex('@missing@', true)).toBe(false);
    expect(await archive.getFile('a.bin')).toEqual(FILES['A.bin']);
    await expect(archive.getFile('missing')).rejects.toThrow('No such file');
  } finally {
    await archive.close();
  }
  const unindexed = new TestArchive(new BlobFile(bytes));
  try {
    expect(await unindexed.getFile('A.bin')).toEqual(FILES['A.bin']);
  } finally {
    await unindexed.close();
  }
});

test('indexed archive rejects misdirected offsets, malformed indexes and corrupted payloads', async () => {
  const wrong = new TestArchive(new BlobFile(await encodeZip(FILES)), {
    '00000000000000000000000000000000': 0n
  });
  // Supply a real digest for a different name to model an index redirect.
  const {MD5Hash} = await import('@loaders.gl/crypto');
  const digest = await new MD5Hash().hash(new TextEncoder().encode('other.bin').buffer, 'hex');
  const redirected = new TestArchive(new BlobFile(await encodeZip(FILES)), {[digest]: 0n});
  try {
    await expect(redirected.getFile('other.bin')).rejects.toThrow('index path mismatch');
  } finally {
    await redirected.close();
    await wrong.close();
  }
  expect(() => parseHashTable(new ArrayBuffer(1))).toThrow('index length');
  expect(() => parseHashTable(new ArrayBuffer(48))).toThrow('Duplicate');
  const bytes = await encodeZip(FILES);
  new Uint8Array(bytes)[35] ^= 1;
  const corrupt = new TestArchive(new BlobFile(bytes));
  try {
    await expect(corrupt.getFile('A.bin')).rejects.toThrow('CRC');
  } finally {
    await corrupt.close();
  }
});

test('indexed archive applies reader budgets and rejects folded fallback collisions', async () => {
  const bounded = new TestArchive(new BlobFile(await encodeZip(FILES)), undefined, undefined, {
    maxDecodedBytes: 2n
  });
  try {
    await expect(bounded.getFile('A.bin')).rejects.toThrow('limit');
  } finally {
    await bounded.close();
  }
  const duplicate = new TestArchive(
    new BlobFile(await encodeZip({...FILES, 'a.bin': new ArrayBuffer(0)}))
  );
  try {
    await expect(duplicate.initializeIndex('@missing@', true)).rejects.toThrow('Duplicate');
  } finally {
    await duplicate.close();
  }
});

test('indexed close cancels pending metadata and closes the transport once', async () => {
  const file = new BlobFile(await encodeZip(FILES));
  const close = vi.spyOn(file, 'close');
  const read = file.read.bind(file);
  let begin!: () => void;
  let release!: () => void;
  const started = new Promise<void>(resolve => {
    begin = resolve;
  });
  const blocked = new Promise<void>(resolve => {
    release = resolve;
  });
  vi.spyOn(file, 'read').mockImplementationOnce(async (...arguments_) => {
    begin();
    await blocked;
    return await read(...arguments_);
  });
  const archive = new TestArchive(file);
  const opening = archive.initializeIndex('@index@');
  const rejected = expect(opening).rejects.toThrow(/closed|aborted/);
  await started;
  const closing = archive.close();
  release();
  await rejected;
  await closing;
  expect(close).toHaveBeenCalledOnce();
});

test('legacy index composition and fallback use locale-independent folding', async () => {
  const bytes = await encodeZip({'I.bin': new Uint8Array([1]).buffer});
  const fallback = new TestArchive(new BlobFile(bytes));
  const localeLowerCase = String.prototype.toLocaleLowerCase;
  const locale = vi.spyOn(String.prototype, 'toLocaleLowerCase').mockImplementation(function (
    this: string
  ) {
    return localeLowerCase.call(this, 'tr');
  });
  let indexed: TestArchive | undefined;
  try {
    expect(await fallback.initializeIndex('@index@', true)).toBe(false);
    const table = parseHashTable(
      await composeHashFile([{fileName: 'I.bin', localHeaderOffset: 0n}])
    );
    indexed = new TestArchive(new BlobFile(bytes), table);
    expect(await indexed.getFile('i.bin')).toEqual(await fallback.getFile('i.bin'));
  } finally {
    locale.mockRestore();
    await indexed?.close();
    await fallback.close();
  }
});
