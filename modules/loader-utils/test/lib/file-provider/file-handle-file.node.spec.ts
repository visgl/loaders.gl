// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import '@loaders.gl/polyfills';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import {FileHandleFile} from '../../../src/lib/file-provider/file-handle-file';

let temporaryDirectory: string;
let temporaryFile: string;

beforeEach(async () => {
  temporaryDirectory = await mkdtemp(join(tmpdir(), 'loaders-file-handle-'));
  temporaryFile = join(temporaryDirectory, 'values.bin');
});

afterEach(async () => {
  await rm(temporaryDirectory, {recursive: true, force: true});
});

describe('FileHandleFile', () => {
  test('reads aligned integer values and slices', async () => {
    const bytes = new Uint8Array(16);
    const view = new DataView(bytes.buffer);
    view.setUint8(0, 250);
    view.setUint16(2, 0x1234, true);
    view.setUint32(4, 0x89abcdef, true);
    view.setBigInt64(8, 123456789n, true);
    await writeFile(temporaryFile, bytes);

    const file = new FileHandleFile(temporaryFile);
    expect(file.length).toBe(16n);
    await expect(file.getUint8(0)).resolves.toBe(250);
    await expect(file.getUint16(2n)).resolves.toBe(0x1234);
    await expect(file.getUint32(4)).resolves.toBe(0x89abcdef);
    await expect(file.getBigUint64(8n)).resolves.toBe(123456789n);
    await expect(file.slice(2n, 6n)).resolves.toEqual(bytes.slice(2, 6).buffer);
    await file.destroy();
  });

  test('appends, truncates, and rejects impossible slices', async () => {
    await writeFile(temporaryFile, new Uint8Array([1, 2]));
    const file = new FileHandleFile(temporaryFile, true);
    await file.append(new Uint8Array([3, 4]));
    expect(file.length).toBe(4n);
    await file.truncate(3);
    expect(file.length).toBe(3n);
    await expect(file.slice(0n, 3n)).resolves.toEqual(new Uint8Array([1, 2, 3]).buffer);
    await expect(file.slice(0n, BigInt(Number.MAX_SAFE_INTEGER) + 1n)).rejects.toThrow(
      'too big slice'
    );
    await file.destroy();
  });

  test('reports reads beyond the end of the file', async () => {
    await writeFile(temporaryFile, new Uint8Array());
    const file = new FileHandleFile(temporaryFile);
    await expect(file.getUint8(0)).rejects.toThrow('something went wrong');
    await expect(file.getUint16(0)).rejects.toThrow();
    await expect(file.getUint32(0)).rejects.toThrow();
    await expect(file.getBigUint64(0)).rejects.toThrow();
    await file.destroy();
  });
});
