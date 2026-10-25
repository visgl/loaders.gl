// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {mkdtemp, writeFile, mkdir, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import '@loaders.gl/core/polyfills';
import {expect, test} from 'vitest';
import {encodeZip, openZipArchive, composeHashFile} from '@loaders.gl/archives/zip';
import {addOneFile, createZip, getFileIterator} from '../../src/zip/lib/zip-composition';

/** Uses tiny isolated files for the actual Node composition wrappers. */
test('ZIP composition retains payloads, comments and index offsets and rejects duplicate appends', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'loaders-zip-compose-'));
  try {
    const archivePath = join(directory, 'archive.zip');
    await writeFile(
      archivePath,
      new Uint8Array(
        await encodeZip(
          {a: new Uint8Array([1, 2, 3])},
          {compression: 'deflate', zip64: 'always', comment: 'café'}
        )
      )
    );
    await addOneFile(archivePath, new Uint8Array([4, 5]), 'é.bin');
    const archive = await openZipArchive(new Uint8Array(await readFile(archivePath)));
    try {
      expect(archive.comment).toBe('café');
      expect(new Uint8Array(await archive.read('a'))).toEqual(new Uint8Array([1, 2, 3]));
      expect(new Uint8Array(await archive.read('é.bin'))).toEqual(new Uint8Array([4, 5]));
    } finally {
      await archive.close();
    }
    const before = await readFile(archivePath);
    await expect(addOneFile(archivePath, new ArrayBuffer(0), 'a')).rejects.toThrow(
      'already exists'
    );
    await expect(addOneFile(archivePath, new Uint8Array([1]), 'folder/')).rejects.toThrow(
      'directory payload'
    );
    expect(await readFile(archivePath)).toEqual(before);
    const source = join(directory, 'source');
    await mkdir(source);
    await writeFile(join(source, 'a.txt'), 'abc');
    const iterator = getFileIterator(source)[Symbol.asyncIterator]();
    expect((await iterator.next()).value).toEqual({
      path: 'a.txt',
      file: new TextEncoder().encode('abc').buffer
    });
    await iterator.return?.();
    const output = join(directory, 'composed.zip');
    await createZip(source, output, async entries => ({
      path: '@index@',
      file: await composeHashFile(entries)
    }));
    const composed = await openZipArchive(new Uint8Array(await readFile(output)));
    try {
      expect(new TextDecoder().decode(await composed.read('a.txt'))).toBe('abc');
      expect(new DataView(await composed.read('@index@')).getBigUint64(16, true)).toBe(0n);
    } finally {
      await composed.close();
    }
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});

test('Node ZIP composition enforces independent output limits and cancellation', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'loaders-zip-limits-'));
  try {
    const source = join(directory, 'source');
    await mkdir(source);
    await writeFile(join(source, 'a'), 'abc');
    await writeFile(join(source, 'b'), 'abc');
    const output = join(directory, 'output.zip');
    for (const options of [{maxEntries: 1}, {maxDirectoryBytes: 1}, {maxArchiveBytes: 22n}])
      await expect(createZip(source, output, undefined, options)).rejects.toThrow('limit');
    await expect(createZip(source, output, undefined, {maxEntries: 0})).rejects.toThrow('limits');
    await expect(createZip(source, output, undefined, {maxArchiveBytes: 1n})).rejects.toThrow(
      'archive limit'
    );
    await expect(
      createZip(source, output, undefined, {signal: AbortSignal.abort(new Error('cancelled'))})
    ).rejects.toThrow('cancelled');
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});
