// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {expect, test} from 'vitest';

/** Node package consumers can load the installed ESM and CommonJS roots. */
test('installed ESM/CJS ZIP entrypoints expose portable reading and writing', async () => {
  const require = createRequire(import.meta.url);
  const entrypointUrl = new URL('./index.js', pathToFileURL(require.resolve('@loaders.gl/zip')));
  const modules = [await import(entrypointUrl.href), require('@loaders.gl/zip')];
  const bytes = new Uint8Array(readFileSync(new URL('./fixtures/python.zip', import.meta.url)));
  for (const module of modules) {
    const archive = await module.openZipArchive(bytes);
    try {
      for (const path of ['folder/abc.txt', 'café.txt']) {
        expect(new TextDecoder().decode(await archive.read(path))).toBe('abc');
      }
    } finally {
      await archive.close();
    }
    const encoded = await module.encodeZip(
      {a: new Uint8Array([97, 98, 99])},
      {compression: 'deflate', zip64: 'always'}
    );
    const written = await module.openZipArchive(encoded);
    try {
      expect(new TextDecoder().decode(await written.read('a'))).toBe('abc');
    } finally {
      await written.close();
    }
  }
  expect(typeof require('@loaders.gl/zip/zip-encode').encodeZipInBatches).toBe('function');
});
