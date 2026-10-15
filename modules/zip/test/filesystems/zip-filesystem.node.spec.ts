// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import '@loaders.gl/polyfills';
import {expect, test} from 'vitest';
import {mkdtemp, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {ZipFileSystem, encodeZip} from '@loaders.gl/zip';

test('ZIP filesystem owns Node paths and resolves archive-qualified resources', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'loaders-zip-filesystem-'));
  const path = join(directory, 'archive.zip');
  try {
    await writeFile(
      path,
      new Uint8Array(await encodeZip({'data.txt': new TextEncoder().encode('node path')}))
    );
    const filesystem = new ZipFileSystem(path);
    try {
      expect(await filesystem.readdir()).toEqual(['data.txt']);
      const response = await filesystem.fetch(`${path}/data.txt`);
      expect(await response.text()).toBe('node path');
      expect(await (await filesystem.fetch(response.url)).text()).toBe('node path');
      await expect(filesystem.fetch(`${path}-other/data.txt`)).rejects.toThrow();
    } finally {
      await filesystem.destroy();
    }
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});
